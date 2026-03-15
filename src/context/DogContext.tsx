import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Alert } from 'react-native';
import { getDb } from '../db/database';
import { ConditionTag, Dog } from '../types';

type DogContextValue = {
  dogs: Dog[];
  currentDogId: string | null;
  currentDog: Dog | null;
  loading: boolean;
  addDog: (data: {
    name: string;
    breed?: string | null;
    dob?: string | null;
    weightKg?: number | null;
    notes?: string | null;
    primaryConditions?: ConditionTag[];
  }) => Promise<void>;
  updateDog: (
    id: string,
    data: {
      name?: string;
      breed?: string | null;
      dob?: string | null;
      weightKg?: number | null;
      notes?: string | null;
      photoUri?: string | null;
      primaryConditions?: ConditionTag[];
    }
  ) => Promise<void>;
  deleteDog: (id: string) => Promise<void>;
  setCurrentDogId: (id: string) => void;
  refresh: () => Promise<void>;
};

const DogContext = createContext<DogContextValue | undefined>(undefined);

export const DogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [currentDogId, setCurrentDogId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDogs = useCallback(async () => {
    try {
      const database = getDb();
      const rows = await database.getAllAsync<any>('SELECT * FROM dogs', []);
      const list: Dog[] = rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        photoUri: row.photoUri,
        breed: row.breed,
        dob: row.dob,
        weightKg: row.weightKg,
        notes: row.notes,
        primaryConditions: row.primaryConditions
          ? (JSON.parse(row.primaryConditions) as string[])
          : [],
      }));
      setDogs(list);
      if (!currentDogId && list.length > 0) {
        setCurrentDogId(list[0].id);
      }
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  }, [currentDogId]);

  useEffect(() => {
    loadDogs();
  }, [loadDogs]);

  const addDog = useCallback(
    async ({
      name,
      breed = null,
      dob = null,
      weightKg = null,
      notes = null,
      primaryConditions = [],
    }: {
      name: string;
      breed?: string | null;
      dob?: string | null;
      weightKg?: number | null;
      notes?: string | null;
      primaryConditions?: ConditionTag[];
    }) => {
      const trimmedName = name.trim();
      if (!trimmedName) return;

      const database = getDb();
      const existing = await database.getAllAsync<any>('SELECT id FROM dogs', []);
      if (existing.length >= 5) {
        Alert.alert('Limit reached', 'Maximum 5 dogs. Remove a dog to add another.');
        loadDogs();
        return;
      }

      const id = `dog_${Date.now()}`;
      try {
        await database.runAsync(
          `
          INSERT INTO dogs (id, name, breed, dob, weightKg, notes, primaryConditions)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
          [id, trimmedName, breed, dob, weightKg, notes, primaryConditions.length ? JSON.stringify(primaryConditions) : null]
        );

        const newDog: Dog = {
          id,
          name: trimmedName,
          breed,
          dob,
          weightKg,
          notes,
          primaryConditions,
        };

        setDogs((prev) => [...prev, newDog]);
        if (!currentDogId) {
          setCurrentDogId(id);
        }
      } catch (error: any) {
        Alert.alert('Error', `Could not save dog: ${error?.message ?? 'Unknown error'}`);
      }
    },
    [currentDogId]
  );

  const updateDog = useCallback(
    async (
      id: string,
      {
        name,
        breed = null,
        dob = null,
        weightKg = null,
        notes = null,
        photoUri,
        primaryConditions,
      }: {
        name?: string;
        breed?: string | null;
        dob?: string | null;
        weightKg?: number | null;
        notes?: string | null;
        photoUri?: string | null;
        primaryConditions?: ConditionTag[];
      }
    ) => {
      const database = getDb();
      const dog = dogs.find((d) => d.id === id);
      if (!dog) return;
      const newName = name !== undefined ? name.trim() : dog.name;
      if (!newName) return;
      try {
        await database.runAsync(
          `UPDATE dogs SET name = ?, breed = ?, dob = ?, weightKg = ?, notes = ?, photoUri = ?, primaryConditions = ? WHERE id = ?`,
          [
            newName,
            breed ?? dog.breed,
            dob ?? dog.dob,
            weightKg ?? dog.weightKg,
            notes ?? dog.notes,
            photoUri !== undefined ? photoUri : dog.photoUri,
            primaryConditions !== undefined
              ? (primaryConditions.length ? JSON.stringify(primaryConditions) : null)
              : (dog.primaryConditions?.length ? JSON.stringify(dog.primaryConditions) : null),
            id,
          ]
        );
        setDogs((prev) =>
          prev.map((d) =>
            d.id !== id
              ? d
              : {
                  ...d,
                  name: newName,
                  breed: breed ?? d.breed,
                  dob: dob ?? d.dob,
                  weightKg: weightKg ?? d.weightKg,
                  notes: notes ?? d.notes,
                  photoUri: photoUri !== undefined ? photoUri : d.photoUri,
                  primaryConditions:
                    primaryConditions !== undefined ? primaryConditions : d.primaryConditions,
                }
          )
        );
      } catch (error: any) {
        Alert.alert('Error', `Could not update dog: ${error?.message ?? 'Unknown error'}`);
      }
    },
    [dogs]
  );

  const deleteDog = useCallback(async (id: string) => {
    const database = getDb();
    try {
      await database.runAsync('DELETE FROM dogs WHERE id = ?', [id]);
      const nextDogs = dogs.filter((d) => d.id !== id);
      setDogs(nextDogs);
      if (currentDogId === id) {
        setCurrentDogId(nextDogs.length > 0 ? nextDogs[0].id : null);
      }
    } catch (error: any) {
      Alert.alert('Error', `Could not remove dog: ${error?.message ?? 'Unknown error'}`);
    }
  }, [currentDogId, dogs]);

  const value: DogContextValue = useMemo(
    () => ({
      dogs,
      currentDogId,
      currentDog: dogs.find((d) => d.id === currentDogId) ?? null,
      loading,
      addDog,
      updateDog,
      deleteDog,
      setCurrentDogId,
      refresh: loadDogs,
    }),
    [addDog, currentDogId, deleteDog, dogs, loadDogs, loading, updateDog]
  );

  return <DogContext.Provider value={value}>{children}</DogContext.Provider>;
};

export function useDogContext(): DogContextValue {
  const ctx = useContext(DogContext);
  if (!ctx) {
    throw new Error('useDogContext must be used within a DogProvider');
  }
  return ctx;
}

