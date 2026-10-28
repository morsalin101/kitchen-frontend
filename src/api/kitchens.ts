export type KitchenStatus =
  | "PENDING_REVIEW"
  | "ACTIVE"
  | "REJECTED";

export type KitchenResponse = {
  id: number;
  name: string;
  description: string | null;
  status: KitchenStatus;
  createdAt: string;
};

export type CreateKitchenRequest = {
  ownerId: number;
  name: string;
  description: string;
};

const API_BASE_URL = "http://localhost:8080";

export async function getKitchens(): Promise<KitchenResponse[]> {
  const response = await fetch(`${API_BASE_URL}/api/kitchens`);

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Failed to load kitchens: ${response.status}`);
  }

  return (await response.json()) as KitchenResponse[];
}

export async function createKitchen(
  request: CreateKitchenRequest,
): Promise<KitchenResponse> {
  const response = await fetch(`${API_BASE_URL}/api/kitchens`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Failed to create kitchen: ${response.status}`);
  }

  return (await response.json()) as KitchenResponse;
}
