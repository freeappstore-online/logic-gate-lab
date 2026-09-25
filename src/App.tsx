import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CircuitNode,
  CircuitState,
  ComponentType,
  Pin,
  Wire,
} from './engine/types';
import {
  createNode,
  stepCircuit,
  getPinPosition,
  cloneCircuit,
} from './engine/circuit';
import { COMPONENT_DEFINITIONS } from './engine/definitions';
import { PRESET_CIRCUITS } from './engine/presets';
import { generateTruthTable, TruthTableData } from './engine/truthTable';
import { NodeRenderer } from './components/NodeRenderer';
import { WireRenderer } from './components/WireRenderer';
import { PaletteDrawer } from './components/PaletteDrawer';
import { Topbar } from './components/Topbar';
import { TruthTableModal } from './components/TruthTableModal';
import { DevTesterModal } from './components/DevTesterModal';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Circuit Core State
  const [nodes, setNodes] = useState<CircuitNode[]>([]);
  const [wires, setWires] = useState<Wire[]>([]);
  const [activePresetId, setActivePresetId] = useState<string>('half-adder');
  const [, setSimulationTick] = useState<number>(0);

  // Synchronous refs for real-time simulation and dragging (eliminates stale closure freezes)
  const nodesRef = useRef<CircuitNode[]>([]);
  nodesRef.current = nodes;
  const wiresRef = useRef<Wire[]>([]);
  wiresRef.current = wires;

  // Simulation Runtime
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [isOscillating, setIsOscillating] = useState<boolean>(false);

  // Selection
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);

  // Canvas Viewport Pan & Zoom
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 100, y: 50 });
  const [zoom, setZoom] = useState<number>(1.0);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const isSpacePressedRef = useRef<boolean>(false);
  const [isMiddleMouseDown, setIsMiddleMouseDown] = useState<boolean>(false);
  const isMiddleMouseDownRef = useRef<boolean>(false);

  // Dragging Refs & State
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragNodeRef = useRef<{
    nodeId: string;
    startX: number;
    startY: number;
    nodeStartX: number;
    nodeStartY: number;
  } | null>(null);

  const panDragRef = useRef<{
    startX: number;
    startY: number;
    panStartX: number;
    panStartY: number;
  } | null>(null);

  // Touch Tracking Ref for mobile 2-finger pinch & pan
  const touchesRef = useRef<Map<number, { clientX: number; clientY: number }>>(new Map());
  const pinchDataRef = useRef<{
    initialDist: number;
    initialZoom: number;
    initialCenter: { x: number; y: number };
    initialPan: { x: number; y: number };
  } | null>(null);

  // Pin-to-Pin Interactive Wiring State
  const [wiringStart, setWiringStart] = useState<{
    nodeId: string;
    pinId: string;
    type: 'input' | 'output';
  } | null>(null);
  const wiringStartRef = useRef<{
    nodeId: string;
    pinId: string;
    type: 'input' | 'output';
  } | null>(null);
  const [draftMousePos, setDraftMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Truth Table Generator Modal
  const [truthTableOpen, setTruthTableOpen] = useState<boolean>(false);
  const [truthTableData, setTruthTableData] = useState<TruthTableData>({
    inputColumns: [],
    outputColumns: [],
    rows: [],
    tooManyInputs: false,
  });

  // Test Bench Modal
  const [testBenchOpen, setTestBenchOpen] = useState<boolean>(false);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number>(performance.now());

  // Convert client viewport coordinates to circuit canvas coordinates
  const clientToCanvasCoords = useCallback(
    (clientX: number, clientY: number) => {
      if (!canvasContainerRef.current) return { x: 0, y: 0 };
      const rect = canvasContainerRef.current.getBoundingClientRect();
      const x = (clientX - rect.left - pan.x) / zoom;
      const y = (clientY - rect.top - pan.y) / zoom;
      return { x, y };
    },
    [pan, zoom]
  );

  // Center preset circuit offset higher & centered horizontally (auto-zooming on mobile)
  const centerPresetCircuit = useCallback((loadedNodes: CircuitNode[]) => {
    if (loadedNodes.length === 0) return;
    const container = canvasContainerRef.current;
    const width = container ? container.clientWidth : window.innerWidth;
    const height = container ? container.clientHeight : window.innerHeight;

    const minX = Math.min(...loadedNodes.map((n) => n.x));
    const maxX = Math.max(...loadedNodes.map((n) => n.x + n.width));
    const minY = Math.min(...loadedNodes.map((n) => n.y));
    const maxY = Math.max(...loadedNodes.map((n) => n.y + n.height));

    const circuitWidth = Math.max(1, maxX - minX);
    const circuitHeight = Math.max(1, maxY - minY);
    const isMobile = width < 640;

    let targetZoom = 1.0;

    if (isMobile) {
      // On mobile viewports: fit circuit into top 60% visible area of canvas
      const availableWidth = Math.max(120, width - 24); // 12px padding on sides
      const availableHeight = Math.max(120, height * 0.58 - 20); // Top 60% of canvas area

      const zoomX = availableWidth / circuitWidth;
      const zoomY = availableHeight / circuitHeight;
      targetZoom = Math.min(1.0, Math.min(zoomX, zoomY));
      targetZoom = Math.max(0.42, Math.min(1.15, targetZoom));

      // Center horizontally
      const targetPanX = Math.round((width - circuitWidth * targetZoom) / 2 - minX * targetZoom);

      // Center vertically within the top 60% area
      const targetCenterY = (height * 0.58) / 2;
      const targetPanY = Math.round(targetCenterY - (circuitHeight * targetZoom) / 2 - minY * targetZoom);

      setPan({ x: targetPanX, y: Math.max(15, targetPanY) });
      setZoom(Number(targetZoom.toFixed(2)));
    } else {
      // Desktop: comfortably centered in upper canvas area
      const availableWidth = Math.max(200, width - 100);
      const availableHeight = Math.max(200, height * 0.65);

      const zoomX = availableWidth / circuitWidth;
      const zoomY = availableHeight / circuitHeight;
      targetZoom = Math.min(1.0, Math.min(zoomX, zoomY));
      targetZoom = Math.max(0.65, Math.min(1.1, targetZoom));

      const targetPanX = Math.round((width - circuitWidth * targetZoom) / 2 - minX * targetZoom);
      const targetPanY = Math.round(Math.max(30, height * 0.38 - (circuitHeight * targetZoom) / 2 - minY * targetZoom));

      setPan({ x: targetPanX, y: targetPanY });
      setZoom(Number(targetZoom.toFixed(2)));
    }
  }, []);

  // 1. Initial Load: Load Half Adder Preset
  useEffect(() => {
    const defaultPreset = PRESET_CIRCUITS.find((p) => p.id === 'half-adder') || PRESET_CIRCUITS[0];
    const initial = defaultPreset.load();
    setNodes(initial.nodes);
    setWires(initial.wires);
    nodesRef.current = initial.nodes;
    wiresRef.current = initial.wires;
    setActivePresetId(defaultPreset.id);

    // Dark theme default
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');

    // Slight delay to ensure canvas rect is calculated
    const timer = setTimeout(() => {
      centerPresetCircuit(initial.nodes);
    }, 60);
    return () => clearTimeout(timer);
  }, [centerPresetCircuit]);

  // Sync theme changes
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (next === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.classList.remove('dark');
    }
  };

  // 2. High-Frequency Simulation Loop
  useEffect(() => {
    let active = true;

    const loop = (now: number) => {
      if (!active) return;

      const delta = now - lastTickTimeRef.current;
      lastTickTimeRef.current = now;

      if (isRunning && nodesRef.current.length > 0) {
        const circuitState: CircuitState = {
          nodes: nodesRef.current,
          wires: wiresRef.current,
        };
        const result = stepCircuit(circuitState, now, delta);
        setIsOscillating(result.oscillating);
        // Trigger tick re-render for wire voltages & indicators without modifying node coordinates
        setSimulationTick((t) => (t + 1) % 10000);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRunning]);

  // 3. Preset Loading
  const handleLoadPreset = (presetId: string) => {
    const preset = PRESET_CIRCUITS.find((p) => p.id === presetId);
    if (!preset) return;
    const loaded = preset.load();
    setNodes(loaded.nodes);
    setWires(loaded.wires);
    nodesRef.current = loaded.nodes;
    wiresRef.current = loaded.wires;
    setActivePresetId(presetId);
    setSelectedNodeId(null);
    setSelectedWireId(null);
    centerPresetCircuit(loaded.nodes);
  };

  // 4. Component Manipulation
  const handleAddComponent = (type: ComponentType, customCoords?: { x: number; y: number }) => {
    let spawnX = 200;
    let spawnY = 120;

    if (customCoords) {
      spawnX = customCoords.x;
      spawnY = customCoords.y;
    } else if (canvasContainerRef.current) {
      const rect = canvasContainerRef.current.getBoundingClientRect();
      const center = clientToCanvasCoords(rect.left + rect.width / 2, rect.top + rect.height * 0.35);
      spawnX = Math.round(center.x - 40);
      spawnY = Math.round(center.y - 30);
    }

    const newNode = createNode(type, spawnX, spawnY);
    setNodes((prev) => {
      const updated = [...prev, newNode];
      nodesRef.current = updated;
      return updated;
    });
    setSelectedNodeId(newNode.id);
    setSelectedWireId(null);
  };

  const handleToggleSwitch = (nodeId: string) => {
    setNodes((prev) => {
      const updated = prev.map((n) => {
        if (n.id === nodeId && n.type === 'SWITCH') {
          const nextVal = !n.state.switchOn;
          return {
            ...n,
            state: {
              ...n.state,
              switchOn: nextVal,
              outputs: { ...n.state.outputs, 'out-0': nextVal },
            },
          };
        }
        return n;
      });
      nodesRef.current = updated;
      return updated;
    });
  };

  const handleChangeClockFreq = (nodeId: string, freq: number) => {
    setNodes((prev) => {
      const updated = prev.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            state: { ...n.state, clockFreq: freq },
          };
        }
        return n;
      });
      nodesRef.current = updated;
      return updated;
    });
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes((prev) => {
      const updated = prev.filter((n) => n.id !== nodeId);
      nodesRef.current = updated;
      return updated;
    });
    setWires((prev) => {
      const updated = prev.filter((w) => w.fromNodeId !== nodeId && w.toNodeId !== nodeId);
      wiresRef.current = updated;
      return updated;
    });
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  const handleDuplicateNode = (nodeId: string) => {
    const target = nodesRef.current.find((n) => n.id === nodeId);
    if (!target) return;

    const snap = 12;
    // Offset diagonally by 48px snapped to grid so it is clearly visible
    const nextX = Math.round((target.x + 48) / snap) * snap;
    const nextY = Math.round((target.y + 48) / snap) * snap;

    const cloned = createNode(target.type, nextX, nextY);
    cloned.label = target.label ? `${target.label} (copy)` : undefined;
    cloned.state = {
      ...cloned.state,
      switchOn: target.state.switchOn,
      clockFreq: target.state.clockFreq,
    };

    const updated = [...nodesRef.current, cloned];
    setNodes(updated);
    nodesRef.current = updated;

    setSelectedNodeId(cloned.id);
    setSelectedWireId(null);
  };

  const handleUpdateLabel = (nodeId: string, newLabel: string) => {
    setNodes((prev) => {
      const updated = prev.map((n) => (n.id === nodeId ? { ...n, label: newLabel } : n));
      nodesRef.current = updated;
      return updated;
    });
  };

  const handleDeleteWire = (wireId: string) => {
    setWires((prev) => {
      const updated = prev.filter((w) => w.id !== wireId);
      wiresRef.current = updated;
      return updated;
    });
    if (selectedWireId === wireId) setSelectedWireId(null);
  };

  const handleClearAll = () => {
    if (nodesRef.current.length === 0) return;
    if (window.confirm('Clear all components and wires from the workbench?')) {
      setNodes([]);
      setWires([]);
      nodesRef.current = [];
      wiresRef.current = [];
      setSelectedNodeId(null);
      setSelectedWireId(null);
    }
  };

  // Node Dragging Start
  const handleStartDragNode = (
    nodeId: string,
    e: React.PointerEvent | React.MouseEvent | React.TouchEvent
  ) => {
    const clientX = 'clientX' in e ? e.clientX : (e as React.TouchEvent).touches?.[0]?.clientX ?? 0;
    const clientY = 'clientY' in e ? e.clientY : (e as React.TouchEvent).touches?.[0]?.clientY ?? 0;
    const targetNode = nodesRef.current.find((n) => n.id === nodeId);
    if (!targetNode) return;

    setSelectedNodeId(nodeId);
    setSelectedWireId(null);
    setDraggingNodeId(nodeId);
    dragNodeRef.current = {
      nodeId,
      startX: clientX,
      startY: clientY,
      nodeStartX: targetNode.x,
      nodeStartY: targetNode.y,
    };
  };

  // 5. Pin-to-Pin Interactive Wiring
  const handleStartWiring = (
    nodeId: string,
    pin: Pin,
    e: React.PointerEvent | React.MouseEvent | React.TouchEvent
  ) => {
    const clientX = 'clientX' in e ? e.clientX : (e as React.TouchEvent).touches?.[0]?.clientX ?? 0;
    const clientY = 'clientY' in e ? e.clientY : (e as React.TouchEvent).touches?.[0]?.clientY ?? 0;
    const coords = clientToCanvasCoords(clientX, clientY);

    const wireInfo = {
      nodeId,
      pinId: pin.id,
      type: pin.type,
    };
    setWiringStart(wireInfo);
    wiringStartRef.current = wireInfo;
    setDraftMousePos(coords);
  };

  const handleEndWiring = (targetNodeId: string, targetPin: Pin) => {
    const activeStart = wiringStartRef.current;
    if (!activeStart) return;

    // Must connect output to input, or input to output, and not on same node
    if (activeStart.type === targetPin.type || activeStart.nodeId === targetNodeId) {
      setWiringStart(null);
      wiringStartRef.current = null;
      return;
    }

    let fromNodeId = activeStart.nodeId;
    let fromPinId = activeStart.pinId;
    let toNodeId = targetNodeId;
    let toPinId = targetPin.id;

    // Normalize so wire is always from Output -> Input
    if (activeStart.type === 'input') {
      fromNodeId = targetNodeId;
      fromPinId = targetPin.id;
      toNodeId = activeStart.nodeId;
      toPinId = activeStart.pinId;
    }

    // Input pin constraint: remove any existing wire going into this target input pin
    const filteredWires = wiresRef.current.filter(
      (w) => !(w.toNodeId === toNodeId && w.toPinId === toPinId)
    );

    const newWire: Wire = {
      id: `w_${Math.random().toString(36).substring(2, 9)}`,
      fromNodeId,
      fromPinId,
      toNodeId,
      toPinId,
      state: false,
    };

    const nextWires = [...filteredWires, newWire];
    setWires(nextWires);
    wiresRef.current = nextWires;

    setWiringStart(null);
    wiringStartRef.current = null;
  };

  const handleCompleteWiring = useCallback(
    (clientX: number, clientY: number) => {
      const activeStart = wiringStartRef.current;
      if (!activeStart) return;

      const coords = clientToCanvasCoords(clientX, clientY);
      let matchedPin: { nodeId: string; pin: Pin } | null = null;
      let minDistance = 26;

      for (const n of nodesRef.current) {
        if (n.id === activeStart.nodeId) continue;
        const meta = COMPONENT_DEFINITIONS[n.type];
        if (!meta) continue;

        for (const p of meta.pins) {
          if (p.type !== activeStart.type) {
            const pinPos = getPinPosition(n, p.id);
            const dist = Math.hypot(pinPos.x - coords.x, pinPos.y - coords.y);
            if (dist < minDistance) {
              minDistance = dist;
              matchedPin = { nodeId: n.id, pin: p };
            }
          }
        }
      }

      if (matchedPin) {
        handleEndWiring(matchedPin.nodeId, matchedPin.pin);
      } else {
        setWiringStart(null);
        wiringStartRef.current = null;
      }
    },
    [clientToCanvasCoords]
  );

  // Global Pointer & Drag Handling (immune to cursor leaving canvas or element boundaries)
  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      // 1. Live Node Dragging with 12px snap-to-grid
      if (dragNodeRef.current) {
        const { nodeId, startX, startY, nodeStartX, nodeStartY } = dragNodeRef.current;
        const deltaX = (e.clientX - startX) / zoom;
        const deltaY = (e.clientY - startY) / zoom;
        const snap = 12;
        const snappedX = Math.round((nodeStartX + deltaX) / snap) * snap;
        const snappedY = Math.round((nodeStartY + deltaY) / snap) * snap;

        setNodes((prev) => {
          const updated = prev.map((n) =>
            n.id === nodeId ? { ...n, x: snappedX, y: snappedY } : n
          );
          nodesRef.current = updated;
          return updated;
        });
      }

      // 2. Live Wiring Draft
      if (wiringStartRef.current) {
        const coords = clientToCanvasCoords(e.clientX, e.clientY);
        setDraftMousePos(coords);
      }

      // 3. Canvas Panning
      if (panDragRef.current) {
        const dx = e.clientX - panDragRef.current.startX;
        const dy = e.clientY - panDragRef.current.startY;
        setPan({
          x: Math.round(panDragRef.current.panStartX + dx),
          y: Math.round(panDragRef.current.panStartY + dy),
        });
      }
    };

    const handleGlobalPointerDown = (e: PointerEvent) => {
      // Middle click (button 1) anywhere on screen starts canvas panning
      if (e.button === 1) {
        e.preventDefault();
        setIsMiddleMouseDown(true);
        isMiddleMouseDownRef.current = true;
        setIsPanning(true);
        panDragRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          panStartX: pan.x,
          panStartY: pan.y,
        };
      }
    };

    const handleGlobalPointerUp = (e: PointerEvent) => {
      if (e.button === 1 || isMiddleMouseDownRef.current) {
        setIsMiddleMouseDown(false);
        isMiddleMouseDownRef.current = false;
      }
      if (dragNodeRef.current) {
        dragNodeRef.current = null;
        setDraggingNodeId(null);
      }
      if (panDragRef.current && !isMiddleMouseDownRef.current && !isSpacePressedRef.current) {
        panDragRef.current = null;
        setIsPanning(false);
      }
      if (wiringStartRef.current) {
        handleCompleteWiring(e.clientX, e.clientY);
      }
    };

    window.addEventListener('pointerdown', handleGlobalPointerDown);
    window.addEventListener('pointermove', handleGlobalPointerMove, { passive: false });
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);

    return () => {
      window.removeEventListener('pointerdown', handleGlobalPointerDown);
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, [pan, zoom, clientToCanvasCoords, handleCompleteWiring]);

  // Canvas Mouse Down: Start Pan or Deselect
  const handlePointerDownCanvas = (e: React.PointerEvent) => {
    // If middle click (button 1) or space is held or clicked on background directly
    const target = e.target as HTMLElement;
    const isCanvasBg =
      target === canvasContainerRef.current ||
      target.tagName.toLowerCase() === 'svg' ||
      target.id === 'canvas-grid-bg';

    if (e.button === 1 || isSpacePressedRef.current || isCanvasBg) {
      e.preventDefault();
      if (e.button === 1) {
        setIsMiddleMouseDown(true);
        isMiddleMouseDownRef.current = true;
      }
      setSelectedNodeId(null);
      setSelectedWireId(null);
      setIsPanning(true);
      panDragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        panStartX: pan.x,
        panStartY: pan.y,
      };
    }
  };

  // Wheel Zoom (centered around cursor, clamped 30% - 250%, non-passive to prevent page scroll)
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Trackpad 2-finger panning (if deltaX is active and no ctrlKey)
      if (!e.ctrlKey && Math.abs(e.deltaX) > 0 && Math.abs(e.deltaY) < 30) {
        setPan((prev) => ({
          x: Math.round(prev.x - e.deltaX),
          y: Math.round(prev.y - e.deltaY),
        }));
        return;
      }

      // Trackpad pinch-to-zoom (ctrlKey=true) or mouse wheel
      let zoomFactor = 1.0;
      if (e.ctrlKey) {
        zoomFactor = Math.exp(-e.deltaY * 0.015);
      } else {
        zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
      }

      setZoom((currentZoom) => {
        const nextZoom = Math.min(2.5, Math.max(0.3, currentZoom * zoomFactor));
        if (Math.abs(nextZoom - currentZoom) < 0.001) return currentZoom;

        setPan((prevPan) => ({
          x: Math.round(mouseX - (mouseX - prevPan.x) * (nextZoom / currentZoom)),
          y: Math.round(mouseY - (mouseY - prevPan.y) * (nextZoom / currentZoom)),
        }));

        return nextZoom;
      });
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, []);

  // Mobile Touch Gestures: 2-Finger Pinch-to-Zoom & Pan
  const handleTouchStartCanvas = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      touchesRef.current.set(t.identifier, { clientX: t.clientX, clientY: t.clientY });
    }

    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const center = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };

      pinchDataRef.current = {
        initialDist: Math.max(10, dist),
        initialZoom: zoom,
        initialCenter: center,
        initialPan: { ...pan },
      };
      setIsPanning(true);
    } else if (e.touches.length === 1 && !dragNodeRef.current && !wiringStartRef.current) {
      const t = e.touches[0];
      panDragRef.current = {
        startX: t.clientX,
        startY: t.clientY,
        panStartX: pan.x,
        panStartY: pan.y,
      };
      setIsPanning(true);
    }
  };

  const handleTouchMoveCanvas = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      touchesRef.current.set(t.identifier, { clientX: t.clientX, clientY: t.clientY });
    }

    // 2-Finger Pinch Zoom & Pan
    if (e.touches.length === 2 && pinchDataRef.current && canvasContainerRef.current) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const currentCenter = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };

      const rect = canvasContainerRef.current.getBoundingClientRect();
      const scale = currentDist / pinchDataRef.current.initialDist;
      const targetZoom = Math.min(2.5, Math.max(0.3, pinchDataRef.current.initialZoom * scale));

      const centerRelX = pinchDataRef.current.initialCenter.x - rect.left;
      const centerRelY = pinchDataRef.current.initialCenter.y - rect.top;

      const panDeltaX = currentCenter.x - pinchDataRef.current.initialCenter.x;
      const panDeltaY = currentCenter.y - pinchDataRef.current.initialCenter.y;

      const zoomedPanX =
        centerRelX -
        (centerRelX - pinchDataRef.current.initialPan.x) * (targetZoom / pinchDataRef.current.initialZoom);
      const zoomedPanY =
        centerRelY -
        (centerRelY - pinchDataRef.current.initialPan.y) * (targetZoom / pinchDataRef.current.initialZoom);

      setZoom(targetZoom);
      setPan({
        x: Math.round(zoomedPanX + panDeltaX),
        y: Math.round(zoomedPanY + panDeltaY),
      });
    }
  };

  const handleTouchEndCanvas = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      touchesRef.current.delete(e.changedTouches[i].identifier);
    }

    if (e.touches.length < 2) {
      pinchDataRef.current = null;
    }
    if (e.touches.length === 0) {
      setIsPanning(false);
      panDragRef.current = null;
    }
  };

  // Keyboard Shortcuts: Spacebar (Pan), Delete/Backspace (Remove), Escape (Deselect)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        isSpacePressedRef.current = true;
        setIsSpacePressed(true);
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') ||
        (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'd' || e.key === 'D'))
      ) {
        if (selectedNodeId) {
          e.preventDefault();
          handleDuplicateNode(selectedNodeId);
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          handleDeleteNode(selectedNodeId);
        } else if (selectedWireId) {
          handleDeleteWire(selectedWireId);
        }
      } else if (e.key === 'Escape') {
        setWiringStart(null);
        wiringStartRef.current = null;
        setSelectedNodeId(null);
        setSelectedWireId(null);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false;
        setIsSpacePressed(false);
        if (!isMiddleMouseDownRef.current) {
          panDragRef.current = null;
          setIsPanning(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedNodeId, selectedWireId]);

  // Drag and Drop from Component Palette
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const componentType = e.dataTransfer.getData('application/logicgate-type') as ComponentType;
    if (componentType) {
      const coords = clientToCanvasCoords(e.clientX, e.clientY);
      handleAddComponent(componentType, {
        x: Math.round(coords.x - 40),
        y: Math.round(coords.y - 30),
      });
    }
  };

  const handlePaletteDragStart = (type: ComponentType, e: React.DragEvent) => {
    e.dataTransfer.setData('application/logicgate-type', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Truth Table Generator Trigger
  const handleOpenTruthTable = () => {
    const tableData = generateTruthTable({ nodes: nodesRef.current, wires: wiresRef.current });
    setTruthTableData(tableData);
    setTruthTableOpen(true);
  };

  // Apply row inputs from truth table directly to circuit
  const handleApplyRowInputs = (inputConfig: Record<string, boolean>) => {
    setNodes((prev) => {
      const updated = prev.map((n) => {
        if (n.type === 'SWITCH' && inputConfig[n.id] !== undefined) {
          return {
            ...n,
            state: {
              ...n.state,
              switchOn: inputConfig[n.id],
              outputs: { ...n.state.outputs, 'out-0': inputConfig[n.id] },
            },
          };
        }
        return n;
      });
      nodesRef.current = updated;
      return updated;
    });

    setTimeout(() => {
      setTruthTableData(generateTruthTable({ nodes: nodesRef.current, wires: wiresRef.current }));
    }, 40);
  };

  return (
    <div
      style={{ height: '100svh', overflow: 'hidden' }}
      className="flex flex-col h-[100svh] w-screen overflow-hidden bg-slate-900 text-slate-100 select-none"
    >
      {/* Top Navigation & Status Bar */}
      <Topbar
        isRunning={isRunning}
        onToggleRun={() => setIsRunning(!isRunning)}
        isOscillating={isOscillating}
        activePresetId={activePresetId}
        onLoadPreset={handleLoadPreset}
        onOpenTruthTable={handleOpenTruthTable}
        onOpenDevTester={() => setTestBenchOpen(true)}
        onClearAll={handleClearAll}
        zoom={zoom}
        onZoomIn={() =>
          setZoom((z) => {
            const next = Math.min(2.5, z * 1.15);
            return next;
          })
        }
        onZoomOut={() =>
          setZoom((z) => {
            const next = Math.max(0.3, z / 1.15);
            return next;
          })
        }
        onResetView={() => centerPresetCircuit(nodesRef.current)}
        theme={theme}
        onToggleTheme={toggleTheme}
        selectedNodeId={selectedNodeId}
        onDuplicateSelected={() => selectedNodeId && handleDuplicateNode(selectedNodeId)}
      />

      {/* Main Interactive Circuit Canvas */}
      <main
        ref={canvasContainerRef}
        onPointerDown={handlePointerDownCanvas}
        onTouchStart={handleTouchStartCanvas}
        onTouchMove={handleTouchMoveCanvas}
        onTouchEnd={handleTouchEndCanvas}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          height: '100%',
          overflow: 'hidden',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
        className={`relative flex-1 w-full circuit-grid overflow-hidden select-none ${
          isPanning || isSpacePressed || isMiddleMouseDown
            ? 'cursor-grabbing [&_*]:cursor-grabbing!'
            : 'cursor-grab'
        }`}
      >
        {/* Transformable Canvas Layer (Panned & Scaled) */}
        <div
          id="canvas-grid-bg"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
          className="absolute inset-0 w-full h-full pointer-events-none select-none"
        >
          {/* Layer 1: Render All Wires */}
          <WireRenderer
            wires={wires}
            nodes={nodes}
            selectedWireId={selectedWireId}
            onSelectWire={(wId) => {
              setSelectedWireId(wId);
              setSelectedNodeId(null);
            }}
            onDeleteWire={handleDeleteWire}
            draftWire={
              wiringStart
                ? {
                    fromNodeId: wiringStart.nodeId,
                    fromPinId: wiringStart.pinId,
                    toX: draftMousePos.x,
                    toY: draftMousePos.y,
                  }
                : null
            }
          />

          {/* Layer 2: Render All Nodes (Container is pointer-events-none, cards are pointer-events-auto) */}
          <div className="absolute inset-0 pointer-events-none">
            {nodes.map((node) => (
              <NodeRenderer
                key={node.id}
                node={node}
                isSelected={selectedNodeId === node.id}
                isWiring={!!wiringStart}
                wiringStartPin={wiringStart}
                onSelect={(id) => {
                  setSelectedNodeId(id);
                  setSelectedWireId(null);
                }}
                onStartDrag={handleStartDragNode}
                onToggleSwitch={handleToggleSwitch}
                onChangeClockFreq={handleChangeClockFreq}
                onDeleteNode={handleDeleteNode}
                onDuplicateNode={handleDuplicateNode}
                onStartWiring={handleStartWiring}
                onEndWiring={handleEndWiring}
                onUpdateLabel={handleUpdateLabel}
              />
            ))}
          </div>
        </div>

        {/* Floating Quick Helper Indicator */}
        <div className="absolute top-3 right-3 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 text-[11px] font-mono text-slate-500 shadow-xs pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Drag gate cards to reposition • Connect pins to wire</span>
        </div>

        {/* Component Palette Drawer */}
        <PaletteDrawer
          onAddComponent={(type) => handleAddComponent(type)}
          onDragStartComponent={handlePaletteDragStart}
        />

        {/* Attribution Sub-footer link */}
        <div className="absolute bottom-2 right-3 text-[10px] text-slate-400 font-mono pointer-events-auto z-20">
          <a
            href="https://freeappstore.online"
            target="_blank"
            rel="noreferrer"
            className="hover:text-blue-400 underline transition-colors"
          >
            Built for freeappstore.online
          </a>
        </div>
      </main>

      {/* Truth Table Generator Slide-over Modal */}
      <TruthTableModal
        isOpen={truthTableOpen}
        onClose={() => setTruthTableOpen(false)}
        data={truthTableData}
        onApplyRowInputs={handleApplyRowInputs}
      />

      {/* Test Bench & Automated Verification Modal */}
      <DevTesterModal
        isOpen={testBenchOpen}
        onClose={() => setTestBenchOpen(false)}
        circuit={{ nodes, wires }}
        isOscillating={isOscillating}
      />
    </div>
  );
}
