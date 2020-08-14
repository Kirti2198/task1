import React, { useState, useEffect } from 'react';
import authSvg from '../assests/update.svg';
import { ToastContainer, toast } from 'react-toastify';
import axios from 'axios';
import { updateUser, isAuth, getCookie, signout } from '../helpers/auth';
import { Link, Redirect } from 'react-router-dom';
import Apple from "../components/Apple";
import Orange from "../components/Orange";
import Grapes from "../components/Grapes";



class Admin extends React.Component {
  render() {
    return(
    <div className="final-container">
    <Apple />
    <Orange />
    <Grapes />
 </div>
    );
  }
}

export default Admin;