import type { Edge, Node } from '@xyflow/react';

/**
 * Calculates positions for nodes in a directed graph using an optimized layered approach
 * with improved grouping and spacing
 * @param nodes The nodes to position
 * @param edges The edges connecting the nodes
 * @returns The nodes with updated positions
 */
export function calculateNodePositions<
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  NodeData extends Record<string, unknown> = any,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  EdgeData extends Record<string, unknown> = any,
>(nodes: Node<NodeData>[], edges: Edge<EdgeData>[]): Node<NodeData>[] {
  // Step 1: Identify root nodes (nodes that are only sources, not targets)
  const targetNodeIds = new Set(edges.map((edge) => edge.target));
  const rootNodeIds = nodes
    .map((node) => node.id)
    .filter((id) => !targetNodeIds.has(id));

  // If no root nodes found, use nodes with the most outgoing connections
  const rootIds =
    rootNodeIds.length > 0 ? rootNodeIds : findAlternativeRoots(nodes, edges);

  // Build adjacency lists for faster traversal
  const outgoingEdges: Record<string, string[]> = {};
  const incomingEdges: Record<string, string[]> = {};

  for (const id of nodes.map((n) => n.id)) {
    outgoingEdges[id] = [];
    incomingEdges[id] = [];
  }

  for (const edge of edges) {
    outgoingEdges[edge.source].push(edge.target);
    incomingEdges[edge.target].push(edge.source);
  }

  // Step 2: Analyze graph structure to determine optimal grouping
  const nodeGroups = analyzeGraphStructure(
    nodes.map((n) => n.id),
    outgoingEdges,
    incomingEdges,
    rootIds,
  );

  // Step 3: Calculate positions based on groups
  const HORIZONTAL_SPACING = 200;
  const VERTICAL_SPACING = 120;
  const GROUP_SPACING = 350;

  const updatedNodes = [...nodes];
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  let groupXOffset = 0;

  for (const [groupIndex, group] of Object.entries(nodeGroups)) {
    const groupNum = Number.parseInt(groupIndex);

    // Calculate group dimensions
    const groupWidth = Math.max(
      group.length * HORIZONTAL_SPACING,
      HORIZONTAL_SPACING,
    );

    // Position nodes within the group
    for (let i = 0; i < group.length; i++) {
      const nodeId = group[i];
      const node = nodeMap.get(nodeId);

      if (node) {
        // Calculate node position within its group
        const x =
          groupXOffset +
          i * HORIZONTAL_SPACING -
          groupWidth / 2 +
          HORIZONTAL_SPACING / 2;

        // Use a more compact vertical layout
        const y = groupNum * VERTICAL_SPACING;

        // Update node position
        const nodeIndex = updatedNodes.findIndex((n) => n.id === nodeId);
        if (nodeIndex !== -1) {
          updatedNodes[nodeIndex] = {
            ...updatedNodes[nodeIndex],
            position: { x, y },
          };
        }
      }
    }

    // Move to the next group position
    groupXOffset += groupWidth + GROUP_SPACING;
  }

  return updatedNodes;
}

/**
 * Analyzes graph structure to determine optimal grouping of nodes
 * @param nodeIds All node IDs in the graph
 * @param outgoingEdges Adjacency list of outgoing edges
 * @param incomingEdges Adjacency list of incoming edges
 * @param rootIds IDs of root nodes
 * @returns Groups of nodes optimized for visualization
 */
function analyzeGraphStructure(
  nodeIds: string[],
  outgoingEdges: Record<string, string[]>,
  incomingEdges: Record<string, string[]>,
  rootIds: string[],
): Record<number, string[]> {
  // Initialize groups
  const groups: Record<number, string[]> = {};
  const assignedNodes = new Set<string>();

  // Helper function to get node weight (connection count)
  const getNodeWeight = (id: string): number => {
    return outgoingEdges[id].length + incomingEdges[id].length;
  };

  // Start with root nodes in group 0
  groups[0] = [...rootIds];
  for (const id of rootIds) {
    assignedNodes.add(id);
  }

  // Group nodes by their connectivity patterns
  let currentGroup = 1;

  // Process nodes in waves based on connectivity
  while (assignedNodes.size < nodeIds.length) {
    const nextWave: string[] = [];

    // Find nodes that connect to the previous group
    for (const groupNodeId of groups[currentGroup - 1] || []) {
      for (const targetId of outgoingEdges[groupNodeId]) {
        if (!assignedNodes.has(targetId)) {
          nextWave.push(targetId);
          assignedNodes.add(targetId);
        }
      }
    }

    // If we couldn't find connected nodes, find any unassigned nodes
    if (nextWave.length === 0) {
      for (const id of nodeIds) {
        if (!assignedNodes.has(id)) {
          nextWave.push(id);
          assignedNodes.add(id);
          break;
        }
      }
    }

    // Sort nodes by their connectivity (more connected nodes first)
    nextWave.sort((a, b) => getNodeWeight(b) - getNodeWeight(a));

    if (nextWave.length > 0) {
      groups[currentGroup] = nextWave;
      currentGroup++;
    }
  }

  // Optimize groups to balance sizes
  return balanceGroups(groups);
}

/**
 * Balances group sizes for better visual distribution
 * @param groups Initial grouping of nodes
 * @returns Balanced groups
 */
function balanceGroups(
  groups: Record<number, string[]>,
): Record<number, string[]> {
  const MAX_GROUP_SIZE = 5;
  const balancedGroups: Record<number, string[]> = {};
  let currentGroup = 0;

  for (const groupNodes of Object.values(groups)) {
    // Split large groups into smaller ones
    if (groupNodes.length > MAX_GROUP_SIZE) {
      for (let i = 0; i < groupNodes.length; i += MAX_GROUP_SIZE) {
        balancedGroups[currentGroup] = groupNodes.slice(i, i + MAX_GROUP_SIZE);
        currentGroup++;
      }
    } else {
      balancedGroups[currentGroup] = groupNodes;
      currentGroup++;
    }
  }

  return balancedGroups;
}

/**
 * Finds alternative root nodes when no clear roots exist
 * @param nodes All nodes in the graph
 * @param edges All edges in the graph
 * @returns Array of node IDs to use as roots
 */
function findAlternativeRoots<
  NodeData extends Record<string, unknown>,
  EdgeData extends Record<string, unknown>,
>(nodes: Node<NodeData>[], edges: Edge<EdgeData>[]): string[] {
  // Count outgoing connections for each node
  const outgoingConnections: Record<string, number> = {};

  for (const node of nodes) {
    outgoingConnections[node.id] = 0;
  }

  for (const edge of edges) {
    outgoingConnections[edge.source] =
      (outgoingConnections[edge.source] || 0) + 1;
  }

  // Find nodes with the most outgoing connections
  const maxOutgoing = Math.max(...Object.values(outgoingConnections));
  return Object.entries(outgoingConnections)
    .filter(([_, count]) => count === maxOutgoing)
    .map(([id]) => id);
}
