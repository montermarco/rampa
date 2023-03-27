import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import './Skills.css';

const Skills = () => {
  const animTextParentRef = useRef();

  useEffect(() => {
    const animTextParent = animTextParentRef.current;
    const animTexts = animTextParent.querySelectorAll('.anim-text');

    const tlOnLoad = gsap.timeline();

    animTexts.forEach((text) => {
      // const textWidth = text.clientWidth;
      tlOnLoad.to(
        text,
        {
          clip: `rect(0px, 600px, 1200px, 0px)`,
          ease: 'expo.out',
          duration: 2,
        },
        '-=0.2'
      );
    });

    tlOnLoad.to(
      '.v-bar',
      { width: 100, ease: 'expo.out', duration: 2 },
      '-=0.2'
    );

    const tlMainAnim = gsap.timeline({ repeat: -1 });

    animTexts.forEach((text) => {
      // const textWidth = text.clientWidth;
      tlMainAnim
        .to(text, { opacity: 1, duration: 0.5 })
        .to(text, {
          clip: `rect(0px, 600px, 1200px, 0px)`,
          ease: 'expo.out',
          duration: 2,
        })
        .to(
          text,
          {
            clip: 'rect(0px, 0px, 1200px, 0px)',
            ease: 'expo.out',
            duration: 2,
          },
          '+=0.75'
        )
        .to(text, { opacity: 0, duration: 0.5 });
    });

    tlOnLoad.add(tlMainAnim, '-=0.5');
  }, []);

  const subtitles = [
    'Art Direction',
    'Motion Graphics',
    'Graphic Design',
    'Interactive Media Systems',
  ];

  return (
    <div ref={animTextParentRef} className="anim-text-parent">
      {subtitles.map((subtitle, index) => (
        <span className="anim-text" key={index}>
          {subtitle}
        </span>
      ))}
      <span className="v-bar"></span>
    </div>
  );
};

export default Skills;
