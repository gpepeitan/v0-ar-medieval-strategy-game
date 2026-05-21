using System;
using System.Collections.Generic;

public static class RouteGraph
{
    public static List<RouteSegmentState> GetOutgoingSegments(GameState state, string nodeId)
    {
        var outgoing = new List<RouteSegmentState>();
        if (state == null || string.IsNullOrWhiteSpace(nodeId))
        {
            return outgoing;
        }

        for (var i = 0; i < state.routeSegments.Count; i++)
        {
            var segment = state.routeSegments[i];
            if (segment == null)
            {
                continue;
            }

            if (string.Equals(segment.fromNodeId, nodeId, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(segment.toNodeId, nodeId, StringComparison.OrdinalIgnoreCase))
            {
                outgoing.Add(segment);
            }
        }

        return outgoing;
    }

    public static float EstimateTravelSeconds(RouteSegmentState segment, float speedMetersPerSecond, float factionMobilityMultiplier)
    {
        if (segment == null)
        {
            return 0f;
        }

        var effectiveSpeed = Math.Max(0.1f, speedMetersPerSecond * factionMobilityMultiplier / Math.Max(0.1f, segment.terrainMultiplier * segment.travelMultiplier));
        return segment.distanceMeters / effectiveSpeed;
    }

    public static RouteSegmentState GetConnectingSegment(GameState state, string fromNodeId, string toNodeId)
    {
        if (state == null || string.IsNullOrWhiteSpace(fromNodeId) || string.IsNullOrWhiteSpace(toNodeId))
        {
            return null;
        }

        for (var i = 0; i < state.routeSegments.Count; i++)
        {
            var segment = state.routeSegments[i];
            if (segment == null)
            {
                continue;
            }

            var forward = string.Equals(segment.fromNodeId, fromNodeId, StringComparison.OrdinalIgnoreCase) &&
                          string.Equals(segment.toNodeId, toNodeId, StringComparison.OrdinalIgnoreCase);
            var reverse = string.Equals(segment.fromNodeId, toNodeId, StringComparison.OrdinalIgnoreCase) &&
                          string.Equals(segment.toNodeId, fromNodeId, StringComparison.OrdinalIgnoreCase);

            if (forward || reverse)
            {
                return segment;
            }
        }

        return null;
    }
}
