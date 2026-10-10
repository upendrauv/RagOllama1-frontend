import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

test('renders the maze and its quest', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: /find your way back to the light/i })).toBeInTheDocument();
  expect(screen.getByRole('grid', { name: /three-dimensional maze/i })).toBeInTheDocument();
  expect(screen.getByText('Moonstone')).toBeInTheDocument();
  expect(screen.getByText('Sunstone')).toBeInTheDocument();
  expect(screen.getByText('Starstone')).toBeInTheDocument();
});

test('moves through the maze and collects a star key', () => {
  render(<App />);

  for (let step = 0; step < 6; step += 1) {
    fireEvent.keyDown(window, { key: 'ArrowRight' });
  }

  expect(screen.getByText('1', { selector: '.quest-progress b' })).toBeInTheDocument();
  expect(screen.getByText('FOUND · GLOWING')).toBeInTheDocument();
  expect(screen.getByText('06')).toBeInTheDocument();
});

test('offers a hint without moving the player automatically', () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /need a little light/i }));

  expect(screen.getByRole('button', { name: /try going/i })).toBeInTheDocument();
  expect(screen.getByText('00')).toBeInTheDocument();
});

test('opens and closes the instructions', () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /open how to play/i }));
  expect(screen.getByRole('dialog', { name: /how to play/i })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /close instructions/i }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
