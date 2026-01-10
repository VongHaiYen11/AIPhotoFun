import React, { useRef, useEffect, useState, useCallback, ChangeEvent, DragEvent } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import { generatePoseFromImage } from '../../services/geminiServices';
import { motion, AnimatePresence } from 'framer-motion';

interface ThreeDeeCanvasProps {
    onPoseChange: (dataUrl: string | null) => void;
}

const CONTROLLABLE_BONES_DATA = [
    { name: 'mixamorigSpine', label: 'Spine' },
    { name: 'mixamorigSpine1', label: 'Spine1' },
    { name: 'mixamorigSpine2', label: 'Spine2' },
    { name: 'mixamorigNeck', label: 'Neck' },
    { name: 'mixamorigHead', label: 'Head' },
    { name: 'mixamorigLeftArm', label: 'L Upper Arm' },
    { name: 'mixamorigLeftForeArm', label: 'L Lower Arm' },
    { name: 'mixamorigLeftHand', label: 'L Hand' },
    { name: 'mixamorigRightArm', label: 'R Upper Arm' },
    { name: 'mixamorigRightForeArm', label: 'R Lower Arm' },
    { name: 'mixamorigRightHand', label: 'R Hand' },
    { name: 'mixamorigLeftUpLeg', label: 'L Upper Leg' },
    { name: 'mixamorigLeftLeg', label: 'L Lower Leg' },
    { name: 'mixamorigLeftFoot', label: 'L Foot' },
    { name: 'mixamorigRightUpLeg', label: 'R Upper Leg' },
    { name: 'mixamorigRightLeg', label: 'R Lower Leg' },
    { name: 'mixamorigRightFoot', label: 'R Foot' },
];

const BONE_NAMES = CONTROLLABLE_BONES_DATA.map(b => b.name);

const BONE_GROUPS: { id: string; titleKey: string; bones: string[] }[] = [
    { id: 'torsoAndHead', titleKey: 'poseAnimator.boneGroups.torsoAndHead', bones: ['mixamorigSpine', 'mixamorigSpine1', 'mixamorigSpine2', 'mixamorigNeck', 'mixamorigHead'] },
    { id: 'leftArm', titleKey: 'poseAnimator.boneGroups.leftArm', bones: ['mixamorigLeftArm', 'mixamorigLeftForeArm', 'mixamorigLeftHand'] },
    { id: 'rightArm', titleKey: 'poseAnimator.boneGroups.rightArm', bones: ['mixamorigRightArm', 'mixamorigRightForeArm', 'mixamorigRightHand'] },
    { id: 'leftLeg', titleKey: 'poseAnimator.boneGroups.leftLeg', bones: ['mixamorigLeftUpLeg', 'mixamorigLeftLeg', 'mixamorigLeftFoot'] },
    { id: 'rightLeg', titleKey: 'poseAnimator.boneGroups.rightLeg', bones: ['mixamorigRightUpLeg', 'mixamorigRightLeg', 'mixamorigRightFoot'] },
];

const getDefaultRotations = (): Record<string, { x: number, y: number, z: number }> => {
    const initialState: Record<string, { x: number, y: number, z: number }> = {};
    BONE_NAMES.forEach(boneName => {
        initialState[boneName] = { x: 0, y: 0, z: 0 };
    });
    return initialState;
};

interface BoneSliderProps {
    boneName: string;
    axis: 'x' | 'y' | 'z';
    value: number;
    onChange: (boneName: string, axis: 'x' | 'y' | 'z', value: number) => void;
}

const BoneSlider: React.FC<BoneSliderProps> = ({ boneName, axis, value, onChange }) => {
    const degrees = Math.round(value * 180 / Math.PI);
    return (
        <div className="grid grid-cols-[1rem_1fr_2.5rem] items-center gap-2">
            <label htmlFor={`${boneName}-${axis}`} className="text-xs text-neutral-400 uppercase font-mono">{axis}</label>
            <input
                id={`${boneName}-${axis}`}
                type="range"
                min={-Math.PI}
                max={Math.PI}
                step={0.01}
                value={value}
                onChange={(e) => onChange(boneName, axis, parseFloat(e.target.value))}
                className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs text-neutral-300 text-right tabular-nums">{degrees}°</span>
        </div>
    );
};


export const ThreeDeeCanvas: React.FC<ThreeDeeCanvasProps> = ({ onPoseChange }) => {
    const { t } = useTranslation();
    const mountRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const bonesRef = useRef<Record<string, THREE.Bone>>({});

    const [rotations, setRotations] = useState<Record<string, { x: number, y: number, z: number }>>(getDefaultRotations);
    const [isLoaded, setIsLoaded] = useState(false);
    const [poseReferenceImage, setPoseReferenceImage] = useState<string | null>(null);
    const [isPosing, setIsPosing] = useState(false);
    const [poseError, setPoseError] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [refinementPrompt, setRefinementPrompt] = useState('');
    const [openAccordion, setOpenAccordion] = useState<string | null>('torsoAndHead');

    const capturePose = useCallback(() => {
        const renderer = rendererRef.current;
        if (renderer) {
            const dataUrl = renderer.domElement.toDataURL('image/png');
            onPoseChange(dataUrl);
        }
    }, [onPoseChange]);

    useEffect(() => {
        if (!mountRef.current) return;

        const currentMount = mountRef.current;
        const { clientWidth: width, clientHeight: height } = currentMount;

        bonesRef.current = {};

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x333333);

        const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
        camera.position.set(0, 1.5, 3.5);

        const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        rendererRef.current = renderer;
        currentMount.appendChild(renderer.domElement);

        const orbitControls = new OrbitControls(camera, renderer.domElement);
        orbitControls.target.set(0, 1, 0);
        orbitControls.enableDamping = true;

        const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
        scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 2);
        dirLight.position.set(5, 10, 7.5);
        scene.add(dirLight);

        const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshStandardMaterial({ color: 0x808080, side: THREE.DoubleSide }));
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        scene.add(floor);
        
        const loader = new GLTFLoader();
        loader.load('https://threejs.org/examples/models/gltf/Xbot.glb', (gltf) => {
            const model = gltf.scene;
            model.scale.set(1.5, 1.5, 1.5);
            
            scene.add(model);
            
            // Center the model horizontally and place it on the floor.
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.x -= center.x;
            model.position.z -= center.z;
            model.position.y = -box.min.y;
            
            model.traverse((object) => {
                if ((object as any).isBone) {
                    bonesRef.current[(object as THREE.Bone).name] = object as THREE.Bone;
                }
            });

            setIsLoaded(true);
            setTimeout(capturePose, 100);
        });

        let animationFrameId: number;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            orbitControls.update();
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            if (currentMount && renderer.domElement.parentNode === currentMount) {
                 currentMount.removeChild(renderer.domElement);
            }
            renderer.dispose();
            orbitControls.dispose();
        };
    }, [capturePose]);
    
    useEffect(() => {
        if (!isLoaded) return;

        const currentBones = bonesRef.current;
        Object.entries(rotations).forEach(([boneName, rot]) => {
            const r = rot as { x: number, y: number, z: number };
            const bone = currentBones[boneName];
            if (bone && r) {
                bone.rotation.set(r.x, r.y, r.z);
            }
        });

        capturePose();
    }, [rotations, isLoaded, capturePose]);
    
    const handleSliderChange = (boneName: string, axis: 'x' | 'y' | 'z', value: number) => {
        setRotations(prev => ({
            ...prev,
            [boneName]: {
                ...prev[boneName],
                [axis]: value
            }
        }));
    };

    const handleGeneratePose = async () => {
        if (!poseReferenceImage) return;
        setIsPosing(true);
        setPoseError(null);
        try {
            const result = await generatePoseFromImage(poseReferenceImage, BONE_NAMES, refinementPrompt);
            setRotations(prev => ({...prev, ...result}));
        } catch (err) {
            setPoseError(err instanceof Error ? err.message : "An unknown error occurred");
        } finally {
            setIsPosing(false);
        }
    };
    
    const handleResetPose = () => {
        setRotations(getDefaultRotations());
    };

    const handleImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => setPoseReferenceImage(reader.result as string);
        reader.readAsDataURL(file);
    };
    
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => { e.target.files && handleImageUpload(e.target.files[0]); };
    const handleDrop = (e: DragEvent<HTMLElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); e.dataTransfer.files && handleImageUpload(e.dataTransfer.files[0]); };
    const handleDragEvents = (e: DragEvent<HTMLElement>, enter: boolean) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(enter); };

    const renderBoneGroup = (group: { id: string; titleKey: string; bones: string[] }) => (
        <div key={group.id} className="bg-neutral-800/50 rounded-lg overflow-hidden">
            <button
                onClick={() => setOpenAccordion(openAccordion === group.id ? null : group.id)}
                className="w-full flex justify-between items-center p-2 text-left bg-neutral-700/50 hover:bg-neutral-700/80 transition-colors"
            >
                <h4 className="text-sm font-bold text-neutral-300">{t(group.titleKey)}</h4>
                <motion.div animate={{ rotate: openAccordion === group.id ? 180 : 0 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </motion.div>
            </button>
            <AnimatePresence>
                {openAccordion === group.id && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="p-2 space-y-2">
                            {group.bones.map(boneName => {
                                const boneData = CONTROLLABLE_BONES_DATA.find(b => b.name === boneName);
                                if (!boneData) return null;
                                return (
                                    <div key={boneName}>
                                        <p className="text-xs font-bold text-neutral-400 ml-1">{boneData.label}</p>
                                        <div className="space-y-1 mt-1">
                                            {(['x', 'y', 'z'] as const).map(axis => (
                                                <BoneSlider
                                                    key={axis}
                                                    boneName={boneName}
                                                    axis={axis}
                                                    value={rotations[boneName]?.[axis] ?? 0}
                                                    onChange={handleSliderChange}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col mt-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full flex-grow min-h-0">
                <div
                    ref={mountRef}
                    className="md:col-span-2 relative aspect-[4/5] md:aspect-auto w-full h-[50vh] md:h-auto rounded-lg overflow-hidden bg-black/40 border-2 border-dashed border-neutral-700"
                >
                    {!isLoaded && <div className="absolute inset-0 flex items-center justify-center text-neutral-400">Loading 3D Model...</div>}
                </div>

                <div className={cn("md:col-span-1 flex flex-col gap-2 min-h-0", !isLoaded && "opacity-50 pointer-events-none")}>
                    <div className="bg-neutral-800/50 p-3 rounded-lg">
                        <h4 className="text-sm font-bold text-neutral-300 mb-1">{t('poseAnimator.poseFromImageTitle')}</h4>
                        <p className="text-xs text-neutral-400 mb-2">{t('poseAnimator.poseFromImageDesc')}</p>
                        <div className="flex gap-2 items-center">
                            {poseReferenceImage ? (
                                <div className="relative group w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                                    <img src={poseReferenceImage} alt="Pose Reference" className="w-full h-full object-cover" />
                                    <button onClick={() => setPoseReferenceImage(null)} className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black/80 transition-opacity opacity-0 group-hover:opacity-100">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            ) : (
                                <label htmlFor="pose-ref-upload" className={cn("cursor-pointer w-16 h-16 flex-shrink-0 flex flex-col items-center justify-center border-2 border-dashed rounded-md transition-colors text-xs", isDragOver ? "border-neutral-400 bg-black/40" : "border-neutral-600 bg-black/20 hover:border-neutral-500")} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onDragEnter={(e) => handleDragEvents(e, true)} onDragLeave={(e) => handleDragEvents(e, false)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                    <span className="text-slate-500 text-center text-[10px] leading-tight">{t('poseAnimator.clickToUpload')}</span>
                                    <input id="pose-ref-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
                                </label>
                            )}
                            <div className="flex flex-col gap-1 w-full">
                                <button onClick={handleGeneratePose} disabled={!poseReferenceImage || isPosing} className="w-full flex items-center justify-center text-sm gap-2 text-black font-bold py-2 px-3 rounded-lg bg-neutral-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                    {isPosing ? t('poseAnimator.generatingPoseButton') : t('poseAnimator.generatePoseButton')}
                                </button>
                                <button onClick={handleResetPose} className="w-full text-sm py-1 px-3 rounded-lg bg-neutral-700/60 hover:bg-neutral-700/90 text-neutral-300 disabled:opacity-50 transition-colors">
                                    {t('poseAnimator.resetPose')}
                                </button>
                            </div>
                        </div>
                        <div className="mt-2">
                            <label htmlFor="pose-refinement" className="text-xs font-bold text-neutral-300 mb-1 block">{t('poseAnimator.refinementPromptLabel')}</label>
                            <textarea
                                id="pose-refinement"
                                value={refinementPrompt}
                                onChange={(e) => setRefinementPrompt(e.target.value)}
                                placeholder={t('poseAnimator.refinementPromptPlaceholder')}
                                rows={2}
                                className="w-full bg-neutral-900/70 border border-neutral-700 rounded-md p-2 text-neutral-200 focus:ring-2 focus:ring-neutral-400 transition text-xs"
                            />
                        </div>
                        {poseError && <p className="text-xs text-red-400 mt-2">{t('poseAnimator.poseGenFailed')}: {poseError}</p>}
                    </div>
                    
                    <div className="flex-grow overflow-y-auto space-y-2 pr-1 pb-2">
                        <p className="text-sm font-bold text-neutral-300 mt-2 p-2">{t('poseAnimator.manualControls')}</p>
                        {BONE_GROUPS.map(renderBoneGroup)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThreeDeeCanvas;