import client from "./client";

export const getShipments = async () => (await client.get("/shipments")).data;
export const getShipmentDetail = async (id) =>
  (await client.get(`/shipments/${id}`)).data;
export const recalculateShipment = async (id) =>
  (await client.post(`/shipments/${id}/recalculate`)).data;
export const actionShipment = async (id) =>
  (await client.post(`/shipments/${id}/action`)).data;
export const getSlaSummary = async () =>
  (await client.get("/sla/summary")).data;
