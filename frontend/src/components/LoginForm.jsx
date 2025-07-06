import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { login } from '../services/auth.service';
import '../styles/LoginStyles.css';

function LoginForm() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      await login(data);
      navigate('/home');
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h1 className='titulo'>Iniciar sesión</h1>
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      <label className="containerInput">
        <p className="tituloInput">Nombre de usuario</p>
        <input
          className='input'
          type="email"
          name="email"
          id="email"
          placeholder="Ingrese nombre de usuario"
          {...register('email', { required: true })}
        />
        {errors.email && <span>Este campo es requerido</span>}
      </label>
      <label className="containerInput">
        <p className="tituloInput">Contraseña</p>
        <input
          className='input'
          type="password"
          name="password"
          id="password"
          placeholder="Ingrese su contraseña"
          {...register('password', { required: true })}
        />
        {errors.password && <span>Este campo es requerido</span>}
      </label>
      <button className='boton' type="submit">Iniciar sesión</button>
    </form>
  );
}

export default LoginForm;
