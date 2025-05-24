import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { SAMPLE_TLE_DATA } from "../client/src/lib/consts";

export async function registerRoutes(app: Express): Promise<Server> {
  // API route to get satellite data
  app.get('/api/satellites', async (req, res) => {
    try {
      // In a real implementation, this would fetch from a real satellite API
      // For this project, we'll use the sample data
      
      // Filter by satellite type if requested
      const typeFilter = req.query.type as string;
      let satellites = SAMPLE_TLE_DATA;
      
      if (typeFilter && typeFilter !== 'ALL') {
        satellites = satellites.filter(sat => sat.type === typeFilter);
      }
      
      // Return the satellite data
      res.json(satellites);
    } catch (error) {
      console.error('Error fetching satellite data:', error);
      res.status(500).json({ 
        error: 'Failed to fetch satellite data',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
