import { Redirect } from 'expo-router';

// Registration is handled inline during OTP verification.
// New users are auto-created on first successful OTP verify.
export default function Register() {
  return <Redirect href="/(auth)/login" />;
}
