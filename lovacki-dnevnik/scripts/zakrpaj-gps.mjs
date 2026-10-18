// Dodatak za praćenje lokacije u Android ljusci traži GPS svake sekunde, što u lovu od nekoliko sati
// troši previše baterije. Ovdje se razmak podiže na 4 s (trag i alarm blizine i dalje su dovoljno točni).
// Pokreće se sam nakon `npm install`.
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const put =
  "node_modules/@capacitor-community/background-geolocation/android/src/main/java/com/equimaps/capacitor_background_geolocation/BackgroundGeolocationService.java";
if (existsSync(put)) {
  const izvor = readFileSync(put, "utf8");
  const novo = izvor
    .replace("locationRequest.setMaxWaitTime(1000);", "locationRequest.setMaxWaitTime(4000);")
    .replace("locationRequest.setInterval(1000);", "locationRequest.setInterval(4000);\n            locationRequest.setFastestInterval(2000);");
  if (novo !== izvor) {
    writeFileSync(put, novo);
    console.log("GPS dodatak: razmak lokacija 4 s");
  }
}
