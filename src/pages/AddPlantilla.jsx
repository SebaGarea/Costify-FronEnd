import React from 'react'
import { useParams } from 'react-router-dom'
import { ItemAddPlantillas } from '../components/ItemAddPlantillas/ItemAddPlantillas.jsx'

export const AddPlantilla = () => {
  const { id } = useParams()
  
  return <ItemAddPlantillas PlantillasId={id} />
}
