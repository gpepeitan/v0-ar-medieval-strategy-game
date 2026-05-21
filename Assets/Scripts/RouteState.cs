using System;

[Serializable]
public sealed class RouteNodeState
{
    public string nodeId;
    public string displayName;
    public double latitude;
    public double longitude;
    public bool isPublicAccess = true;
}

[Serializable]
public sealed class RouteSegmentState
{
    public string segmentId;
    public string fromNodeId;
    public string toNodeId;
    public float distanceMeters;
    public float terrainMultiplier = 1f;
    public float travelMultiplier = 1f;
    public string controllingPlayerId;
    public int tollFood;
    public int tollWood;
    public int tollStone;
    public int tollIron;
    public bool isBridge;
    public bool isRoad = true;
}

[Serializable]
public sealed class CaravanState
{
    public string caravanId;
    public string ownerPlayerId;
    public string originNodeId;
    public string destinationNodeId;
    public string currentSegmentId;
    public float progress01;
    public float carriedFood;
    public float carriedWood;
    public float carriedStone;
    public float carriedIron;
    public long departureUtcTicks;
    public long arrivalEtaUtcTicks;
    public bool isVisible;
}
