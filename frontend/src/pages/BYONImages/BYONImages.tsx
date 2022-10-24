import * as React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AddNewImageForm from './AddNewImageForm';
import BYONImagesHome from './BYONImagesHome';

const BYONImages: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<BYONImagesHome />} />
      <Route path="/add-new-image" element={<AddNewImageForm />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
};

export default BYONImages;
