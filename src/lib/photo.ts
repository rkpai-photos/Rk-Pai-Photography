/* eslint-disable */
// @ts-nocheck
import { fetchFromGoogleSheet } from "./googleSheets";

export interface Photo {
  id: string;
  alt: string;
  width: number;
  height: number;
  story: string;
  created_at: string;
  image_type: string;
  image_url: string;
}

export async function fetchPhotos(): Promise<Photo[]> {
  try {
    // Fetch raw data from Google Sheets
    const rawPhotos = await fetchFromGoogleSheet();

    // Process the photos to ensure proper types and structure
    const processedPhotos = rawPhotos.map((item) => {
      return {
        id: item.id || "",
        src: item.image_url, // Use image_url as src for component compatibility
        alt: item.alt || "",
        width: parseInt(item.width) || 300,
        height: parseInt(item.height) || 200,
        story: item.story || "",
        createdAt: item.created_at || new Date().toISOString(),
        imageType: item.image_type || "jpeg",
        // Keep original fields for reference
        image_url: item.image_url,
        image_type: item.image_type,
        created_at: item.created_at,
      };
    });

    console.log(
      `Total photos fetched from Google Sheets: ${processedPhotos.length}`,
    );
    return processedPhotos;
  } catch (error) {
    console.error("Error fetching photos from Google Sheets:", error);
    return [];
  }
}
