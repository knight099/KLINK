import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from './api';

export interface District {
  id: string;
  code: string;
  name: string;
  state: { code: string; name: string };
  _count?: { suppliers: number };
}

interface DistrictContextType {
  activeDistrict: District | null;
  districts: District[];
  setDistrict: (district: District) => void;
  isLoading: boolean;
}

const DistrictContext = createContext<DistrictContextType | undefined>(undefined);

export const DistrictProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [districts, setDistricts] = useState<District[]>([]);
  const [activeDistrict, setActiveDistrict] = useState<District | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDistricts() {
      try {
        const res = await apiFetch<{ districts: District[] }>('/geo/districts');
        setDistricts(res.districts);

        const savedId = localStorage.getItem('klink_selected_district_id');
        const found = res.districts.find((d) => d.id === savedId);
        if (found) {
          setActiveDistrict(found);
        } else {
          // Default to Darbhanga (MVP Launch Market)
          const darbhanga = res.districts.find((d) => d.code === 'DARBHANGA') || res.districts[0];
          if (darbhanga) {
            setActiveDistrict(darbhanga);
            localStorage.setItem('klink_selected_district_id', darbhanga.id);
          }
        }
      } catch (e) {
        console.error('Failed to load districts:', e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDistricts();
  }, []);

  const setDistrict = (district: District) => {
    setActiveDistrict(district);
    localStorage.setItem('klink_selected_district_id', district.id);
  };

  return (
    <DistrictContext.Provider value={{ activeDistrict, districts, setDistrict, isLoading }}>
      {children}
    </DistrictContext.Provider>
  );
};

export const useDistrict = () => {
  const context = useContext(DistrictContext);
  if (!context) throw new Error('useDistrict must be used within a DistrictProvider');
  return context;
};

