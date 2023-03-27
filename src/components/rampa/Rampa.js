import React, { useEffect } from 'react';
import { gsap } from 'gsap';
import './Rampa.css';

const Rampa = () => {
  useEffect(() => {
    gsap.fromTo(
      '.copy span',
      {
        x: 50,
        opacity: 0,
      },
      {
        delay: 1, // 1 second delay
        duration: 2, // 1 second duration
        x: 0,
        opacity: 1,
        ease: 'power2.easeOut',
        stagger: {
          from: 'start', // From left side
          amount: 0.5, // Every 0.5 seconds
        },
      }
    );
  }, []);

  return (
    <div className="container">
      <p className="copy">
        <span>R</span>
        <span>A</span>
        <span>M</span>
        <span>P</span>
        <span>A</span>
      </p>
    </div>
  );
};

export default Rampa;
