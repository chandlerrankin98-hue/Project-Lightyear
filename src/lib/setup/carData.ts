import ferrari296Gt3 from "@/data/cars/ferrari-296-gt3.json";
import bmwM4Gt3 from "@/data/cars/bmw-m4-gt3.json";
import porsche992Gt3R from "@/data/cars/porsche-992-gt3-r.json";
import mclaren720sGt3Evo from "@/data/cars/mclaren-720s-gt3-evo.json";
import mercedesAmgGt3Evo from "@/data/cars/mercedes-amg-gt3-evo.json";
import type { CarData } from "./types";

const CAR_DATA: Record<string, CarData> = {
  ferrari_296_gt3: ferrari296Gt3 as CarData,
  bmw_m4_gt3: bmwM4Gt3 as CarData,
  porsche_992_gt3_r: porsche992Gt3R as CarData,
  mclaren_720s_gt3_evo: mclaren720sGt3Evo as CarData,
  mercedes_amg_gt3_evo: mercedesAmgGt3Evo as CarData,
};

export function getCarData(carId: string): CarData {
  const car = CAR_DATA[carId];
  if (!car) {
    throw new Error(`no car data for "${carId}"; available: ${Object.keys(CAR_DATA).join(", ")}`);
  }
  return car;
}

export function listCarIds(): string[] {
  return Object.keys(CAR_DATA);
}
