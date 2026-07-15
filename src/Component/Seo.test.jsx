import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// 1. Import the provider from the library
import { HelmetProvider } from 'react-helmet-async'; 

import Seo from './Seo';

describe('Seo', () => {
  test('renders without crashing', () => {
    // 2. Wrap the component being tested with the HelmetProvider
    render(
      <HelmetProvider>
        <Seo title="Test" />
      </HelmetProvider>
    );
  });
});