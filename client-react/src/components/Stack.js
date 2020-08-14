import "./Style.css";
import React from "react";

class Stack extends React.Component {
   stack = this.props.stack.map((value) => {
      console.log("Apple");

      return value;
   });

   render() {
      return (
         <div className="stack">
            {/* <div className="in_stack"></div> */}
            {this.stack}
         </div>
      );
   }
}

export default Stack;
