import React from 'react'
import { Helmet } from 'react-helmet-async';

const Seo = ({ title, description, page, keywords }) => {
  return (
    <div>
      <Helmet>
        <title>{title}</title>
        <meta 
          name="description" 
          content={description} 
        />
        <link 
          rel="canonical" 
          
        />
        <meta 
          name="keywords" 
          content={keywords}
        />
        

      </Helmet>
    </div>
  )
}

export default Seo;
