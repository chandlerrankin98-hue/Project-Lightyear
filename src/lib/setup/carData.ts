import ferrari296Gt3 from "@/data/cars/ferrari-296-gt3.json";
import bmwM4Gt3 from "@/data/cars/bmw-m4-gt3.json";
import porsche992Gt3R from "@/data/cars/porsche-992-gt3-r.json";
import mclaren720sGt3Evo from "@/data/cars/mclaren-720s-gt3-evo.json";
import mercedesAmgGt3Evo from "@/data/cars/mercedes-amg-gt3-evo.json";
import alpineA110Gt4 from "@/data/cars/alpine-a110-gt4.json";
import amrV8VantageGt4 from "@/data/cars/amr-v8-vantage-gt4.json";
import audiR8Gt4 from "@/data/cars/audi-r8-gt4.json";
import bmwM4Gt4 from "@/data/cars/bmw-m4-gt4.json";
import chevroletCamaroGt4R from "@/data/cars/chevrolet-camaro-gt4r.json";
import ginettaG55Gt4 from "@/data/cars/ginetta-g55-gt4.json";
import ktmXbowGt4 from "@/data/cars/ktm-xbow-gt4.json";
import maseratiMcGt4 from "@/data/cars/maserati-mc-gt4.json";
import mclaren570SGt4 from "@/data/cars/mclaren-570s-gt4.json";
import mercedesAmgGt4 from "@/data/cars/mercedes-amg-gt4.json";
import porsche718CaymanGt4Mr from "@/data/cars/porsche-718-cayman-gt4-mr.json";
import type { CarData } from "./types";

const CAR_DATA: Record<string, CarData> = {
  ferrari_296_gt3: ferrari296Gt3 as CarData,
  bmw_m4_gt3: bmwM4Gt3 as CarData,
  porsche_992_gt3_r: porsche992Gt3R as CarData,
  mclaren_720s_gt3_evo: mclaren720sGt3Evo as CarData,
  mercedes_amg_gt3_evo: mercedesAmgGt3Evo as CarData,
  alpine_a110_gt4: alpineA110Gt4 as CarData,
  amr_v8_vantage_gt4: amrV8VantageGt4 as CarData,
  audi_r8_gt4: audiR8Gt4 as CarData,
  bmw_m4_gt4: bmwM4Gt4 as CarData,
  chevrolet_camaro_gt4r: chevroletCamaroGt4R as CarData,
  ginetta_g55_gt4: ginettaG55Gt4 as CarData,
  ktm_xbow_gt4: ktmXbowGt4 as CarData,
  maserati_mc_gt4: maseratiMcGt4 as CarData,
  mclaren_570s_gt4: mclaren570SGt4 as CarData,
  mercedes_amg_gt4: mercedesAmgGt4 as CarData,
  porsche_718_cayman_gt4_mr: porsche718CaymanGt4Mr as CarData,
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
