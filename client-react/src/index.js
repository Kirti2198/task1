import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route, Redirect, Switch } from 'react-router-dom';
import App from './App.js';
import Login from './screens/Login.jsx';
import ForgetPassword from './screens/ForgetPassword.jsx';
import Register from './screens/Register.jsx';
import Private from './screens/Private.jsx';
import Admin from './screens/Admin.jsx';
import Activate from './screens/Activate.jsx';
import Reset from './screens/Reset';

import PrivateRoute from './Routes/PrivateRoute';
import AdminRoute from './Routes/AdminRoute';




import 'react-toastify/dist/ReactToastify.css';
ReactDOM.render(
  <BrowserRouter>
    <Switch>
      {/* <Route path='/' exact render={props => <App {...props} />} /> */}
      <Route path='/' exact render={props => <Login {...props} />} />
      <Route path='/register' exact render={props => <Register {...props} />} />
      <Route path='/users/password/forget' exact render={props => <ForgetPassword {...props} />} />
      <Route path='/users/password/reset/:token' exact render={props => <Reset {...props} />} />
      <Route path='/users/activate/:token' exact render={props => <Activate {...props} />} />
      <PrivateRoute path="/private" exact component={Private} />
       <AdminRoute path="/admin" exact component={Admin} />
      <Redirect to='/' />
    </Switch>
  </BrowserRouter>,
  document.getElementById('root')
);

