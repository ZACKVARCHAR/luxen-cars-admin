# Luxen Cars — Admin (back-office)

Application **séparée** du site public (`landPa`). Même identité visuelle (rouge / noir, Outfit + Manrope).

- URL : http://localhost:3001  
- API : http://localhost:8080  
- Login : `admin@luxencars.ma` / `ChangeMe123!`

## Modules

- Dashboard — KPI flotte & encaissements  
- Flotte — CRUD + changement de statut  
- Réservations — liste + statut (demandes web incluses)  
- Clients — fiches agence  

## Démarrage

```powershell
cd ..\System
docker compose up -d
cd backend
.\mvnw.cmd spring-boot:run

cd ..\..\admin
npm install
npm run dev
```

Variables : `admin/.env.local` → `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080`
