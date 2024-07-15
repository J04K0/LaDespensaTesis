import LoginForm from '../components/LoginForm';
import { useNavigate } from 'react-router-dom';
import '../styles/LoginStyles.css';

function Login() {
  const navigate = useNavigate();

  // if (localStorage.getItem('user')) {
  //   return (
  //     <>
  //       <h2>Ya estas logeado!</h2>
  //       <button onClick={() => navigate('/')}>Ir a home</button>
  //     </>
  //   );
  // }

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
