import { Component } from '@angular/core';

import {
  Invitation,
  InvitationAcceptOptions,
  Inviter,
  InviterInviteOptions,
  Registerer,
  Session,
  SessionState,
  UserAgent,
  UserAgentOptions,
  Web,
} from 'sip.js/lib/index';

import { IncomingResponse } from 'sip.js/lib/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'video-call-demo';
  
  public userAgent: any;
  public registerer: any;
  public incomingInvitation: any;
  public outgoingInviter: any;
  public session: any;

  constructor() {
    this.login('qweqw', '123', 'asd');
  }

  async login(username: string, password: string, domain: string) {
    const _uri = UserAgent.makeURI(`sip:${username}@${domain}`);
    console.log(_uri);
    if (!_uri) {
      return;
    }
    const _userAgentOptions: UserAgentOptions = {
      uri: _uri,
      authorizationUsername: username,
      authorizationPassword: password,
      transportOptions: {
        server: 'wss://sip.etelecom.vn:10443',
      },
      logLevel: 'debug',
      displayName: username,
      delegate: {
        onInvite: (invitation: Invitation) => {
          this.incomingInvitation = invitation;
          this.session = invitation;
          this._sessionStateListener();

          if (this.incomingInvitation.request.headers['X-Session-Id']?.length) {
          }
        },
      },
    };
    this.userAgent = new UserAgent(_userAgentOptions);
    this.registerer = new Registerer(this.userAgent, {});

    console.log(this.userAgent);
    console.log(this.registerer);

    await this.userAgent?.start();
    await this.registerer?.register();
  }

  async logout() {
    await this.registerer?.unregister();
    await this.userAgent?.stop();
  }

  callTest() {
    console.log(123);
  }

  _sessionStateListener() {
    this.session.stateChange.addListener((state: SessionState) => {
      switch (state) {
        // Cuộc gọi vừa được khởi tạo.
        case SessionState.Initial: {
          console.log('iniut');
          break;
        }

        // Cuộc gọi vừa được chấp nhận.
        case SessionState.Establishing: {
          console.log('iniut');
          break;
        }

        // Cuộc gọi bắt đầu diễn ra.
        case SessionState.Established: {
          console.log('iniut');
          break;
        }

        // Cuộc gọi vừa được kết thúc.
        case SessionState.Terminating: {
          console.log('iniut');
          break;
        }

        // Cuộc gọi hoàn toàn kết thúc
        case SessionState.Terminated: {
          console.log('iniut');
          break;
        }

        default:
      }
    });
  }

  async hold(isHold: boolean) {
    const _holdOptions: Web.SessionDescriptionHandlerOptions = {
      hold: isHold,
    };

    this.session.sessionDescriptionHandlerOptionsReInvite = _holdOptions;

    this.session.invite().then();
  }
  _processCalls() {
    const sessionDescriptionHandler = this.session.sessionDescriptionHandler;
    if (
      sessionDescriptionHandler &&
      sessionDescriptionHandler instanceof Web.SessionDescriptionHandler
    ) {
      // tìm Audio Element trên HTML DOM
      const remoteAudio = document.getElementById('remote') as HTMLAudioElement;
      // sau đó gán MediaStream làm source của Audio Element đó
      remoteAudio.srcObject = sessionDescriptionHandler.remoteMediaStream;
      // gọi hàm play() để phát âm thanh.
      remoteAudio
        .play()
        .catch((err) => console.error('ERROR in Streaming Remote Audio', err));
    }
  }

  // async hangup() {
  //   if (**Cuộc gọi là cuộc gọi đi và mới được khởi tạo, chưa được chấp nhận**) {
  //     await this.outgoingInviter.cancel();
  //   } else {
  //     await this.session?.bye();
  //   }
  // }

  async call(phoneNumber: string, domain: string) {
    const target = UserAgent.makeURI(`sip:${phoneNumber}@${domain}`);
    if (!target) {
      return;
    }

    const inviter = new Inviter(this.userAgent, target, {});

    this.outgoingInviter = inviter;
    this.session = inviter;

    this._sessionStateListener();

    const _inviterInviteOptions: InviterInviteOptions = {
      requestDelegate: {
        // Khi cuộc gọi bắt đầu thì sự kiện onProgress này xảy ra.
        onProgress: (response: IncomingResponse) => {
          if (response.message.headers['X-Session-Id']?.length) {
            // TODO: lấy X-Session-Id ra để phục vụ cho việc lấy Call Logs (nếu cần).
          }
        },
        // Khi cuộc gọi được người nhận chấp nhận thì sự kiện onAccept này xảy ra.
        onAccept: (response: IncomingResponse) => {
          this.session = inviter;
          this._processCalls();
        },
      },
    };
  }
}
