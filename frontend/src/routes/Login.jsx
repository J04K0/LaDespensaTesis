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
        <form action="#">
          <h1 className='titulo'>Iniciar sesión</h1>
          <label className="containerInput">
            <p className="tituloInput">Nombre de usuario</p>
            <input className='input' type="text" name="username" id="username" placeholder="Ingrese nombre de usuario" required />
          </label>
          <label className="containerInput">
          <p className="tituloInput">Contraseña</p>
          <input className='input' type="text" name="password" id="password" placeholder="Ingrese su contraseña" required />
          </label>
          <button className='boton'>Iniciar sesión</button>
          <label className="containerOlvidaste">
            <a className="olvidaste" href="#">¿Olvidaste tu contraseña?</a>
          </label>
        </form>
      </div>
    </div>
  );
}

export default Login;
