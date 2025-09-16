
import { useParams } from 'react-router';
import { ItemDetailProduct, Loader } from '../components'
import { useItemsById } from '../hooks/productos'



export const DetailProduct = () => {
 
  const {id} = useParams();

  const {product, loading}=useItemsById(id);

  return loading ? <Loader/> : <ItemDetailProduct products={product}/>

}
