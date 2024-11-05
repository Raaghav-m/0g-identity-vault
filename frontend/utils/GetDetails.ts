async function getDetails(rootHash: string) {
  try {
    const response = await fetch(`api/get-details?rootHash=${rootHash}`);
    if (!response.ok) {
      throw new Error("Failed to fetch details");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in getDetails:", error);
    throw error;
  }
}

export { getDetails };
