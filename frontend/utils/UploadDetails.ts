interface UploadDetailsParams {
  field: string;
  newValue: string;
  previousHash: string;
  walletAddress: string;
}

interface UploadResponse {
  success: boolean;
  transaction?: any;
  newRootHash?: string;
  error?: string;
}

const uploadDetails = async (
  params: UploadDetailsParams
): Promise<UploadResponse> => {
  try {
    const response = await fetch("/api/upload-details", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error.message || "Failed to upload details",
    };
  }
};

export { uploadDetails, type UploadDetailsParams, type UploadResponse };
