import React from 'react';
import ShaderSchene from '../shaderScene/ShaderSchene';
import About from '../about/About';
import Work from '../work/Work';
import Contact from '../contact/Contact';
import './HorizontalScroll.css';

const HorizontalScroll = () => {
  const items = [<ShaderSchene />, <Work />, <About />, <Contact />];

  return (
    <div className="scroll-container">
      {items.map((item, index) => (
        <div key={index} className="scroll-content">
          {item}
        </div>
      ))}
    </div>
  );
};

export default HorizontalScroll;
