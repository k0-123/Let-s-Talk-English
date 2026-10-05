// Safe-area insets need a native provider; use the library's own test mock.
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default)
