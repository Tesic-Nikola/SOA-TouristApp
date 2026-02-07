export interface Tour {
  id: string;
  authorId: string;
  name: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  waypoints: Waypoint[];
}

export interface Waypoint {
  id?: string;
  latitude: number;
  longitude: number;
  name: string;
  description: string;
  imagePath?: string;
}

export interface CreateTourRequest {
  name: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags?: string[];
}

export interface ShoppingCart {
  id?: string;
  touristId: string;
  tourIds: string[];
}

export interface Purchase {
  id: string;
  touristId: string;
  tourId: string;
  token: string;
  purchasedAt: Date;
}

export interface TourExecution {
  id: string;
  touristId: string;
  tourId: string;
  startedAt: Date;
  completedAt?: Date;
  abandonedAt?: Date;
  lastActivity: Date;
  completedWaypoints: WaypointCompletion[];
}

export interface WaypointCompletion {
  waypointId: string;
  completedAt: Date;
}

export interface PositionSimulator {
  id: string;
  touristId: string;
  latitude: number;
  longitude: number;
  updatedAt: Date;
}