import React from 'react';
import { Canvas } from '@react-three/fiber';
import Skills from '../skills/Skills';
import Sphere from '../sphere/Sphere';
import Rampa from '../rampa/Rampa';
import './ShaderScene.css';

const ShaderSchene = () => {
  return (
    <div className="scene-container">
      <Rampa />
      <Skills />
      <Canvas>
        <Sphere />
      </Canvas>
    </div>
  );
};

export default ShaderSchene;
