import React, { Component } from "react";
import Problem from "./Problem";
import Input from "./Input";
import GameMode from "./Modes";
import GameOverMessage from "./GameOverMessage";

import "./MathTrainer.css";
import "./Zen.css";

export default class MathTrainer extends Component {
  constructor(props) {
    super(props);
    this.Game = GameMode.newGame(this.props.options);
    this.state = {
      problem: { num1: 0, num2: 0, sign: "" },
      input: "",
      timeLeft:
        this.Game.hasTimer || !this.Game.practice || this.Game.startTime,
      isGameOver: true,
      problems: [],
    };
  }

  updateProblem = (wasSkipped) => {
    let [num1, num2, sign] = this.Game.getNewProblem();
    let answer;
    if (sign === "/" && num1 !== 0) {
      // Probably can clean this up.
      // This has to be here (and not in the GameMode methods) because it overrides the generated problem.
      let h = num1;
      let num3 = num1 * num2;
      answer = num2;
      num1 = num3;
      num2 = h;
    } else {
      answer = this.Game.compute(num1, num2, sign);
    }
    this.setState({
      problem: { num1, num2, answer, sign },
      input: "",
    });
    if (!wasSkipped) {
      this.setState((s) => ({
        timeLeft: s.timeLeft + this.Game.bonus,
      }));
    }
  };

  handleInput = (val) => {
    let { num1, num2, sign, answer } = this.state.problem;
    this.setState({ input: val });
    if (this.state.problem.answer == val) {
      this.setState(
        {
          problems: [
            ...this.state.problems,
            `${num1} ${sign} ${num2} = ${answer}`,
          ],
        },
        () => {
          if (!this.Game.isFinished(this.state.problems.length)) {
            if (this.state.problems.length % 5 === 0) {
              // I may want to abstract the threshold into the Mode classes.
              this.Game.increaseChallenge();
            }
            this.updateProblem();
          } else {
            this.endGame();
          }
        }
      );
    }
  };
  endGame = () => {
    clearInterval(this.state.timerTimeLeft);
    clearInterval(this.state.timerTimeTaken);
    this.setState((s) => ({
      isGameOver: true,
      timeLeft: 0,
      timeTaken: s.timeTaken + 1, // The timeLeft timer doesn't actually count all the way to 0, so this little addition gets the last second.
    }));
  };
  tickTimer = () => {
    // This feels pretty hacky to me, will probably want to clean up later.
    if (this.state.timeLeft > 1) {
      this.setState((s) => ({
        timeLeft: s.timeLeft - 1,
      }));
    } else if (this.state.timeLeft === 1) {
      this.endGame();
    }
  };

  restart = () => {
    this.updateProblem();
    this.setState({ isGameOver: false, problems: [] });
    if (this.Game.hasTimer) {
      this.setState({
        timeLeft: this.Game.startTime,
        timeTaken: 0,
        timerTimeLeft: setInterval(() => {
          this.tickTimer();
        }, 1000),
        timerTimeTaken: setInterval(() => {
          this.setState((s) => ({
            timeTaken: s.timeTaken + 1,
          }));
        }, 1000),
      });
    }
  };

  handleOptions = () => {
    this.props.handleRestart();
  };

  componentDidMount() {
    this.restart();
  }
  render() {
    let timerMessage;
    if(this.Game.mode !== 'Zen') {
      timerMessage = !this.state.isGameOver ? (
        <h2>
          {!this.Game.hasTimer ||
            this.state.timeLeft ||
            this.state.timeTaken}
        </h2>
      ) : (
        <GameOverMessage
          solved={this.state.problems.length}
          timeElapsed={this.state.timeTaken}
          goal={3}
          restart={this.restart}
          goHome={this.handleOptions}
        />
      )
    } else timerMessage = null
    
    let { num1, num2, sign, answer } = this.state.problem;
    return (
      <div className={`${this.Game.mode}`}>
        <div className="game-area">
          {/* Problem List */}
          {this.Game.mode === "Zen" ? (
            <div className="problem-list">
              {this.state.problems.map((p, i) => {
                return (
                  <span className={`${this.Game.mode} problem`}>
                    {p}
                  </span>
                );
              })}
            </div>
          ) : null}
          {/* Timer / Message */}
          {timerMessage}
          {/* Problem & Input */}
          {this.state.timeLeft > 0 || !this.state.isGameOver ? (
            <Problem
              mode={this.Game.mode}
              num1={num1}
              num2={num2}
              answer={answer}
              sign={sign}
              probNum={this.state.problems.length + 1}
            >
              <Input
                handleInput={this.handleInput}
                updateProblem={this.updateProblem}
                input={this.state.input}
                restart={this.restart}
                hasSkip={this.Game.hasSkip}
                isGameOver={this.state.timeLeft === 0}
              />
            </Problem>
          ) : null}

          <button
            className="button options-button"
            onClick={this.handleOptions}
          >
            Select a new mode
          </button>
        </div>
        {/* Video */}
        {this.Game.mode == "Zen" ? (
          <iframe
            className="video Zen"
            src="https://www.youtube.com/embed/5qap5aO4i9A?autoplay=1"
            frameborder="0"
            allow="autoplay; encrypted-media"
            allowfullscreen
            title="video"
          />
        ) : null}
      </div>
    );
  }
}