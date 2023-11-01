import { Hub } from 'aws-amplify/utils';

import {
  AuthActorState,
  AuthMachineState,
} from '../../machines/authenticator/types';
import { groupLog, isFunction } from '../../utils';

import { AuthInterpreter, AuthMachineHubHandler } from './types';
import { ALLOWED_SPECIAL_CHARACTERS, emailRegex } from './constants';
import { getCurrentUser } from 'aws-amplify/auth';

// replaces all characters in a string with '*', except for the first and last char
export const censorAllButFirstAndLast = (value: string): string => {
  const split = value.trim().split('');
  for (let i = 0; i < split.length; i++) {
    if (i > 0 && i < split.length - 1) {
      split[i] = '*';
    }
  }

  return split.join('');
};

// censors all but the last four characters of a phone number
export const censorPhoneNumber = (val: string): string => {
  if (val.length < 4) {
    return val;
  }

  const split = val.split('');
  for (let i = 0; i < split.length - 4; i++) {
    split[i] = '*';
  }

  return split.join('');
};

/**
 * Handles Amplify JS Auth hub events, by forwarding hub events as appropriate
 * xstate events.
 */
export const defaultAuthHubHandler: AuthMachineHubHandler = async (
  { payload: { event } },
  service,
  options
) => {
  groupLog('+++defaultAuthHubHandler', event);
  const { send } = service;
  const state = service.getSnapshot(); // this is just a getter and is not expensive
  const { onSignIn, onSignOut } = options ?? {};

  switch (event) {
    case 'signInWithRedirect_failure':
      break;
    // TODO: We can add more cases here, according to
    // https://docs.amplify.aws/lib/auth/auth-events/q/platform/js/
    case 'tokenRefresh': {
      if (state.matches('authenticated.idle')) {
        // just call getCurrentUser here
        send('TOKEN_REFRESH');
      }
      break;
    }
    case 'signInWithRedirect': {
      // if (isFunction(onSignInWithRedirect)) {
      //   // getCurrentUser()
      //   //   .then('onSignInWithRedirect')
      //   //   .catch((e) => {
      //   //     return;
      //   //   });
      // }
      break;
    }
    case 'signedIn': {
      if (isFunction(onSignIn)) {
        onSignIn();
      }
      break;
    }
    case 'signedOut':
    case 'tokenRefresh_failure':
      if (isFunction(onSignOut)) {
        onSignOut();
      }
      send('SIGN_OUT');
      break;
    default:
      break;
  }
};

type HubHandler = Parameters<typeof Hub.listen>[1];
const getHubEventHandler =
  (service: AuthInterpreter, handler: AuthMachineHubHandler): HubHandler =>
  (data) => {
    handler(data, service);
  };

/**
 * Listens to external auth Hub events and sends corresponding event to
 * the `authService` of interest
 *
 * @param send - `send` function associated with the `authService` of interest
 *
 * @returns function that unsubscribes to the hub evenmt
 */
export const listenToAuthHub = (
  service: AuthInterpreter,
  // angular passes its own `handler` param
  handler: AuthMachineHubHandler = defaultAuthHubHandler
) => {
  return Hub.listen(
    'auth',
    getHubEventHandler(service, handler),
    'authenticator-hub-handler'
  );
};

export const hasSpecialChars = (password: string) =>
  ALLOWED_SPECIAL_CHARACTERS.some((char) => password.includes(char));

export const getTotpCodeURL = (
  issuer: string,
  username: string,
  secret: string
): string =>
  encodeURI(
    `otpauth://totp/${issuer}:${username}?secret=${secret}&issuer=${issuer}`
  );

export function trimValues<T extends Record<string, string>>(
  values: T,
  ...ignored: string[]
): T {
  return Object.entries(values).reduce(
    (acc, [name, value]) => ({
      ...acc,
      [name]: ignored.includes(name) ? value : value?.trim(),
    }),
    {} as T
  );
}

export const isValidEmail = (value: string | undefined) => {
  if (!value) return false;

  return emailRegex.test(value);
};

export const getRoute = (
  state: AuthMachineState,
  actorState: AuthActorState
) => {
  switch (true) {
    case state.matches('idle'):
      return 'idle';
    case state.matches('setup'):
      return 'setup';
    case state.matches('signOut'):
      return 'signOut';
    case state.matches('authenticated'):
      return 'authenticated';
    case actorState?.matches('confirmSignUp'):
    case actorState?.matches('confirmSignUp.resendConfirmationCode'):
      return 'confirmSignUp';
    case actorState?.matches('confirmSignIn'):
      return 'confirmSignIn';
    case actorState?.matches('setupTOTP.edit'):
    case actorState?.matches('setupTOTP.submit'):
      return 'setupTOTP';
    case actorState?.matches('signIn'):
    case state?.matches('signIn.getCurrentUser'):
      return 'signIn';
    case actorState?.matches('signUp'):
      return 'signUp';
    case actorState?.matches('forceNewPassword'):
      return 'forceNewPassword';
    case state?.matches('forgotPassword'):
    case state?.matches('resetPassword'):
      return 'resetPassword';
    case actorState?.matches('confirmResetPassword'):
      return 'confirmResetPassword';
    case actorState?.matches('verifyUser'):
      return 'verifyUser';
    case actorState?.matches('confirmVerifyUser'):
      return 'confirmVerifyUser';
    case actorState?.matches('setupTOTP.getTotpSecretCode'):
    case state.matches('signIn.runActor'):
      /**
       * This route is needed for autoSignIn to capture both the
       * autoSignIn.pending and the resolved states when the
       * signIn actor is running.
       */
      return 'transition';
    default:
      groupLog('state', state);
      groupLog('actorState', actorState);
      console.debug(
        'Cannot infer `route` from Authenticator state:',
        state.value
      );
      return null;
  }
};
