using UnityEngine;

public static class RouteTravelModel
{
    public static float GetBaseMovementSpeedMetersPerSecond()
    {
        return 1.25f;
    }

    public static float GetFactionMobilityMultiplier(string factionId)
    {
        var faction = FactionCatalog.GetOrNull(factionId);
        return faction != null ? faction.MobilityModifier : 1f;
    }

    public static float GetRouteTravelSeconds(RouteSegmentState segment, string factionId)
    {
        return RouteGraph.EstimateTravelSeconds(segment, GetBaseMovementSpeedMetersPerSecond(), GetFactionMobilityMultiplier(factionId));
    }

    public static float GetCompressedTravelHours(float distanceMeters)
    {
        if (distanceMeters <= 0f)
        {
            return 0f;
        }

        var km = distanceMeters / 1000f;
        if (km <= 2f)
        {
            return km * 0.25f;
        }

        if (km <= 20f)
        {
            return 0.5f + (km - 2f) * 0.1f;
        }

        return 2.3f + Mathf.Log10(km - 19f + 1f) * 2.0f;
    }
}
