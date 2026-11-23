export function vehicleImageUrl(path?: string | null) {
  if (!path) return "/vehicles/peugeot-208.png";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return path;
  return `/${path}`;
}

export function statusLabel(status: string) {
  const map: Record<string, string> = {
    AVAILABLE: "Disponible",
    RESERVED: "Réservé",
    RENTED: "En location",
    MAINTENANCE: "En maintenance",
    IMMOBILIZED: "Immobilisé",
    ACCIDENTED: "Accidenté",
    SOLD: "Vendu",
    DRAFT: "Brouillon",
    PENDING: "En attente",
    CONFIRMED: "Confirmée",
    CONVERTED_TO_RENTAL: "Convertie",
    CANCELLED: "Annulée",
    EXPIRED: "Expirée",
    OPEN: "Ouverte",
    CLOSED: "Clôturée",
    DISPUTED: "Litige",
    HELD: "Retenue",
    RELEASED: "Libérée",
    PARTIALLY_RETAINED: "Partielle",
    FULLY_RETAINED: "Conservée",
    PLANNED: "Planifiée",
    IN_PROGRESS: "En cours",
    DONE: "Terminée",
  };
  return map[status] || status.replaceAll("_", " ");
}
