import * as React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AddNewImageForm from './AddImagePage/AddNewImageForm';
import CREResourcesHome from './ImageHomePage/CREResourcesHome';
import { UpdateImageForm } from './UpdateImagePage/UpdateImageForm';

const CREResources: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<CREResourcesHome />} />
      <Route path="/add-new-resource" element={<AddNewImageForm />} />
      <Route path="/edit-resource" element={<UpdateImageForm />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
};

export default CREResources;
