import LoginForm from '../components/LoginForm';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import '../styles/LoginStyles.css';

function Login() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Agregar la clase login-page al body cuando el componente se monta
    document.body.classList.add('login-page');
    
    // Eliminar la clase cuando el componente se desmonta
    return () => {
      document.body.classList.remove('login-page');
    };
  }, []);

  return (
  <div className="containerLogin">
    <div className="containerImagen">
      <img className='imagen' src="LaDespensaLogo.png" alt="Logo_La_Despensa"/>
    </div>
    <div className="containerLog">
            <LoginForm />     
      </div>
    </div>
  );
}

export default Login;
