import React from 'react';
import Proyect from '../layout/Proyect';
import {proyects} from '../../assets/utils/proyects';
import { v4 as uuidv4 } from 'uuid';


const Graphic = () => {

  const graphics = proyects.filter( proyect => proyect.category === "graphic");
  
  return (
    <>
      {
        graphics.map( proyect => (
          <Proyect
            key={uuidv4()}
            header={proyect.header}
            title={proyect.title}
            description={proyect.description}
            assets={proyect.assets}
          />
        ))
      }
    </>
  )
};

export default Graphic;