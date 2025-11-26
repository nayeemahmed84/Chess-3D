import { useMemo, useRef, useEffect } from 'react';
import { Vector2, Vector3, Color, Mesh } from 'three';
import { useFrame } from '@react-three/fiber';

interface PieceProps {
    type: string; // p, r, n, b, q, k
    color: 'w' | 'b';
    position: [number, number, number]; // target board position
    isCaptured?: boolean;
}

export const Piece = ({ type, color, position, isCaptured }: PieceProps) => {
    const isWhite = color === 'w';
    const materialColor = isWhite ? '#ffffff' : '#1a1a1a';

    // ---- Geometry generation (unchanged) ----
    const points = useMemo(() => {
        const pts: Vector2[] = [];
        const add = (x: number, y: number) => pts.push(new Vector2(x, y));
        switch (type) {
            case 'p':
                add(0, 0); add(0.3, 0); add(0.32, 0.05); add(0.3, 0.1);
                add(0.15, 0.15); add(0.12, 0.5); add(0.09, 0.65);
                add(0.11, 0.7); add(0.16, 0.75); add(0.2, 0.82);
                add(0.2, 0.92); add(0.16, 0.99); add(0.1, 1.02); add(0, 1.02);
                break;
            case 'r':
                add(0, 0); add(0.3, 0); add(0.32, 0.05); add(0.3, 0.1);
                add(0.15, 0.15); add(0.13, 0.6); add(0.18, 0.65);
                add(0.2, 0.9); add(0.25, 0.95); add(0.25, 1.15);
                add(0.15, 1.15); add(0.15, 1.05); add(0, 1.05);
                break;
            case 'n':
                add(0, 0); add(0.3, 0); add(0.32, 0.05); add(0.3, 0.1);
                add(0.15, 0.15); add(0.13, 0.55); add(0.17, 0.65);
                add(0.25, 0.75); add(0.28, 0.85); add(0.25, 0.95);
                add(0.2, 1.05); add(0.15, 1.15); add(0.08, 1.2); add(0, 1.2);
                break;
            case 'b':
                add(0, 0); add(0.3, 0); add(0.32, 0.05); add(0.3, 0.1);
                add(0.15, 0.15); add(0.13, 0.6); add(0.11, 0.7);
                add(0.13, 0.75); add(0.18, 0.8); add(0.2, 0.95);
                add(0.18, 1.08); add(0.12, 1.18); add(0.08, 1.28);
                add(0.04, 1.35); add(0, 1.38);
                break;
            case 'q':
                add(0, 0); add(0.3, 0); add(0.32, 0.05); add(0.3, 0.1);
                add(0.16, 0.15); add(0.14, 0.65); add(0.12, 0.8);
                add(0.14, 0.85); add(0.18, 0.9); add(0.2, 1.05);
                add(0.22, 1.15); add(0.25, 1.25); add(0.23, 1.35);
                add(0.18, 1.42); add(0.12, 1.48); add(0.06, 1.52);
                add(0, 1.54);
                break;
            case 'k':
                add(0, 0); add(0.3, 0); add(0.32, 0.05); add(0.3, 0.1);
                add(0.16, 0.15); add(0.14, 0.65); add(0.12, 0.85);
                add(0.14, 0.9); add(0.18, 0.95); add(0.2, 1.1);
                add(0.22, 1.2); add(0.24, 1.3); add(0.22, 1.4);
                add(0.15, 1.5); add(0.12, 1.58); add(0.12, 1.68);
                add(0.08, 1.72); add(0, 1.72);
                break;
            default:
                add(0, 0); add(0.2, 0); add(0.15, 0.5); add(0, 0.5);
        }
        return pts;
    }, [type]);

    // ---- Animation refs ----
    const meshRef = useRef<Mesh>(null);
    const trailRef = useRef<Mesh>(null);
    const startPos = useRef<Vector3>(new Vector3(...position));
    const targetPos = useRef<Vector3>(new Vector3(...position));
    const progress = useRef(0);
    const animating = useRef(false);

    // When the board position changes, start animation and trail
    useEffect(() => {
        const newTarget = new Vector3(...position);
        if (!meshRef.current) return;
        startPos.current.copy(meshRef.current.position);
        targetPos.current.copy(newTarget);
        progress.current = 0;
        animating.current = true;
        // Setup trail geometry (a thin plane) based on direction
        if (trailRef.current) {
            const dir = newTarget.clone().sub(startPos.current);
            const length = dir.length();
            const mid = startPos.current.clone().add(dir.multiplyScalar(0.5));
            trailRef.current.position.copy(mid);
            trailRef.current.scale.set(length, 0.1, 1);
            trailRef.current.lookAt(newTarget);
            const mat = trailRef.current.material as any;
            mat.opacity = 0.6;
            mat.transparent = true;
            trailRef.current.visible = true;
        }
    }, [position]);

    // Frame loop: move piece and fade trail
    useFrame((_state, delta) => {
        // Handle capture animation
        if (isCaptured && meshRef.current) {
            const mat = meshRef.current.material as any;
            // Fade out and scale down
            mat.opacity = Math.max(0, mat.opacity - delta * 2);
            mat.transparent = true;
            const s = Math.max(0, meshRef.current.scale.x - delta * 2);
            meshRef.current.scale.set(s, s, s);
            return;
        }

        if (!animating.current) return;
        progress.current += delta * 2.5; // ~0.4s duration
        if (progress.current >= 1) {
            progress.current = 1;
            animating.current = false;
        }
        // Ease out cubic function: 1 - (1 - t)^3
        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
        const lerpPos = startPos.current.clone().lerp(targetPos.current, easeOutCubic(progress.current));
        if (meshRef.current) meshRef.current.position.copy(lerpPos);
        // Fade trail opacity while moving
        if (trailRef.current && trailRef.current.visible) {
            const mat = trailRef.current.material as any;
            mat.opacity = Math.max(0, mat.opacity - delta * 1.5);
            if (mat.opacity <= 0) trailRef.current.visible = false;
        }
    });

    return (
        <group>
            {/* Trail – thin semi‑transparent plane that fades */}
            <mesh ref={trailRef} visible={false}>
                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial color={new Color('#a0a0ff')} transparent opacity={0.6} depthWrite={false} />
            </mesh>
            <mesh ref={meshRef} castShadow receiveShadow>
                <latheGeometry args={[points, 32]} />
                <meshPhysicalMaterial
                    color={materialColor}
                    roughness={0.05}
                    metalness={0}
                    transmission={0.85}
                    thickness={1.5}
                    clearcoat={1}
                    clearcoatRoughness={0.05}
                    ior={1.5}
                    reflectivity={0.9}
                />
            </mesh>
        </group>
    );
};
