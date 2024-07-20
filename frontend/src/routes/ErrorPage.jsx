import { useRouteError } from 'react-router-dom';

const ErrorPage = () => {
  const error = useRouteError();
  console.error({
    status: error.status,
    statusText: error.statusText,
    message: error.message ? error.message : 'No message',
  });

  return (
    <div>
      <h1>Oops!</h1>
      <p>Sorry, un error inesperado a ocurrido.</p>
    </div>
  );
};

export default ErrorPage;
