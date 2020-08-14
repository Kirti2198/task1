import "../assests/Style.css";
import React from "react";

class Apple extends React.Component {
   state = { value: 0 };

   onIncreaseValue = () => {
      if (this.state.value < 10) {
         this.setState({ value: this.state.value + 1 });
      }
      //   console.log("Clicked");
   };

   onDecreaseValue = () => {
      if (this.state.value > 0) {
         this.setState({ value: this.state.value - 1 });
      }
      //   console.log("Clicked");
   };

   render() {
      return (
         <div className="apple" style={{ backgroundColor: "rgb(172, 16, 16)" }}>
            <div>
               <h3>Apple</h3>
               <h3>{this.state.value}</h3>
            </div>
            <div>
               <i
                  className="plus circle big icon"
                  onClick={this.onIncreaseValue}
               />
               <i
                  className="minus circle big icon"
                  onClick={this.onDecreaseValue}
               />
            </div>
         </div>
      );
   }
}

export default Apple;
