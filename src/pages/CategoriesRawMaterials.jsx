import React from 'react'
import { useMpByCategories } from '../hooks/materiasPrimas';
import { ItemListContainerRawMaterials, Loader } from '../components/index.js';
import { useParams } from 'react-router';

export const CategoriesRawMaterials = () => {

const {nombre} = useParams();
const {mp, loading} = useMpByCategories(nombre);


return loading ? <Loader/> : <ItemListContainerRawMaterials rawMaterials={mp} />
}