// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { PureComponent } from "react";
import PT from "prop-types";
import styled from "styled-components";
import { modelUtils } from "../datamodel/Utils";
import {
  Direction,
  PARTICIPANT_MESSAGE,
  ATTACHMENT_MESSAGE,
} from "../datamodel/Model";
import renderHTML from "react-render-html";
import {
  MessageBox,
  ParticipantMessage,
  ParticipantTyping,
} from "./ChatMessages/ChatMessage";
import { SystemMessage } from "./ChatMessages/SystemMessage";
import ChatTranscriptScroller from "./ChatTranscriptScroller";
import { CONTACT_STATUS } from "connect-constants";
import FAQComponent from "./FAQComponent";

const TranscriptBody = styled.div`
  margin: 0 auto;
`;

const ContainerWrapper = styled.div`
  height: 100%;
  background: #ededed;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
    "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial,
    sans-serif;
  display: flex;
  flex-direction: column;
`;

const FAQHeader = styled.div`
  background: #ffffff;
  border-bottom: 1px solid #e5e5e5;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: #f8f9fa;
  }
`;

const FAQHeaderContent = styled.div`
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const FAQTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #333333;
`;

const FAQArrow = styled.div`
  font-size: 12px;
  color: #999999;
  transform: ${(props) => (props.expanded ? "rotate(90deg)" : "rotate(0deg)")};
  transition: transform 0.2s ease;
`;

const FAQPanel = styled.div`
  max-height: ${(props) => (props.expanded ? "250px" : "0")};
  overflow: hidden;
  transition: max-height 0.3s ease;
  background: #ffffff;
  border-bottom: ${(props) => (props.expanded ? "1px solid #e5e5e5" : "none")};
`;

const FAQContent = styled.div`
  max-height: 250px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 2px;
  }
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const TranscriptWrapper = styled(ChatTranscriptScroller)`
  background: ${(props) => props.theme.chatTranscriptor.background};
  -webkit-text-size-adjust: none;
  text-size-adjust: none;
  flex: 12 1 auto;
`;

const FAQContainer = styled.div`
  height: 100%;
  background: #ededed;
  overflow-y: auto;
  padding: 16px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 2px;
  }
`;

const defaultTranscriptConfig = {
  participantMessageConfig: {
    render: ({ ...props }) => {
      return <ParticipantMessage {...props} />;
    },
  },

  attachmentMessageConfig: {
    render: ({ ...props }) => {
      return <ParticipantMessage {...props} />;
    },
  },

  systemMessageConfig: {
    render: ({ ...props }) => {
      return <SystemMessage {...props} />;
    },
  },
};

export default class ChatTranscriptor extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      faqExpanded: false,
      hasFAQFile: false,
    };
  }

  static propTypes = {
    contactId: PT.string.isRequired,
    transcript: PT.array,
    typingParticipants: PT.array.isRequired,
    contactStatus: PT.string.isRequired,
    loadPreviousTranscript: PT.func.isRequired,
    sendReadReceipt: PT.func.isRequired,
  };

  componentDidMount() {
    this.checkFAQFile();
  }

  checkFAQFile = async () => {
    try {
      const possiblePaths = ["./faq.csv", "/faq.csv", "faq.csv"];
      let found = false;

      for (const path of possiblePaths) {
        try {
          const response = await fetch(path);
          if (response.ok) {
            found = true;
            console.log("FAQ file found at:", path);
            break;
          }
        } catch (err) {
          // 继续尝试下一个路径
        }
      }

      this.setState({ hasFAQFile: found });
    } catch (error) {
      console.log("FAQ file check failed:", error);
      this.setState({ hasFAQFile: false });
    }
  };

  toggleFAQ = () => {
    this.setState({ faqExpanded: !this.state.faqExpanded });
  };

  loadTranscript = () => {
    console.log("CCP", "ChatTranscriptor - transcriptLoading true");
    return this.props.loadPreviousTranscript().then((data) => {
      console.log("CCP", "ChatTranscriptor - transcript Loading complete");
      return data;
    });
  };

  renderMessage = (itemDetails, isLatestMessage) => {
    const itemId = itemDetails.id;
    const version = itemDetails.version;
    const messageReceiptType =
      itemDetails.transportDetails &&
      itemDetails.transportDetails.messageReceiptType
        ? itemDetails.transportDetails.messageReceiptType
        : "";
    const key = `${itemId}.${version}.${messageReceiptType}`;

    const transcriptConfig = Object.assign(
      {},
      defaultTranscriptConfig,
      this.props.transcriptConfig
    );
    let config = {
      render: transcriptConfig.render,
      isHTML: transcriptConfig.isHTML,
    };

    let content = null;
    let additionalProps = {};

    if (config.render) {
      content = config.render({
        key: key,
        messageDetails: itemDetails,
      });
    }

    let textAlign = "left";

    if (itemDetails.type === PARTICIPANT_MESSAGE) {
      config = Object.assign(
        {},
        config,
        transcriptConfig.participantMessageConfig
      );
      additionalProps = {
        mediaOperations: {
          addMessage: this.props.addMessage,
          downloadAttachment: this.props.downloadAttachment,
        },
        textInputRef: this.props.textInputRef,
        isLatestMessage,
        sendReadReceipt: this.props.sendReadReceipt,
      };
    } else if (itemDetails.type === ATTACHMENT_MESSAGE) {
      config = Object.assign(
        {},
        config,
        transcriptConfig.attachmentMessageConfig
      );
      additionalProps = {
        mediaOperations: {
          downloadAttachment: this.props.downloadAttachment,
        },
        isLatestMessage,
        sendReadReceipt: this.props.sendReadReceipt,
      };
    } else if (modelUtils.isRecognizedEvent(itemDetails.content.type)) {
      config = Object.assign({}, config, transcriptConfig.systemMessageConfig);
      textAlign = "center";
    } else {
      return <React.Fragment />;
    }
    if (!content && config && config.render) {
      content = config.render({
        key: key,
        messageDetails: itemDetails,
        ...additionalProps,
      });
    }

    return (
      <MessageBox key={key} textAlign={textAlign}>
        {config.isHTML ? renderHTML(content) : content}
      </MessageBox>
    );
  };

  renderTyping = (participantTypingDetails) => {
    var participantId = participantTypingDetails.participantId;
    var displayName = participantTypingDetails.displayName;
    var direction = participantTypingDetails.direction;
    return (
      <ParticipantTyping
        key={participantId}
        displayName={displayName}
        direction={direction}
      />
    );
  };

  render() {
    const lastSentMessage = this.props.transcript
      .filter(
        ({ type, transportDetails }) =>
          (type === PARTICIPANT_MESSAGE || type === ATTACHMENT_MESSAGE) &&
          transportDetails.direction === Direction.Outgoing
      )
      .pop();

    const lastMessageIndex = this.props.transcript.length - 1;

    const chatContent = (
      <TranscriptWrapper
        contactId={this.props.contactId}
        type={this.props.contactStatus}
        loadPreviousTranscript={this.loadTranscript}
        lastSentMessageId={lastSentMessage ? lastSentMessage.id : null}
      >
        {(this.props.contactStatus === CONTACT_STATUS.CONNECTED ||
          this.props.contactStatus === CONTACT_STATUS.ACW ||
          this.props.contactStatus === CONTACT_STATUS.ENDED) && (
          <TranscriptBody>
            {this.props.transcript.map((item, idx) =>
              this.renderMessage(item, idx === lastMessageIndex)
            )}
            {this.props.typingParticipants.map((typing) =>
              this.renderTyping(typing)
            )}
          </TranscriptBody>
        )}
      </TranscriptWrapper>
    );

    if (!this.state.hasFAQFile) {
      return chatContent;
    }

    return (
      <ContainerWrapper>
        <FAQHeader onClick={this.toggleFAQ}>
          <FAQHeaderContent>
            <FAQTitle>FAQ</FAQTitle>
            <FAQArrow expanded={this.state.faqExpanded}>▶</FAQArrow>
          </FAQHeaderContent>
        </FAQHeader>
        <FAQPanel expanded={!this.state.faqExpanded}>
          <FAQContent>
            <FAQComponent />
          </FAQContent>
        </FAQPanel>
        <MainContent>{chatContent}</MainContent>
      </ContainerWrapper>
    );
  }
}
