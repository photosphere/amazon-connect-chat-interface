// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useState, useEffect } from "react";
import styled from "styled-components";

const FAQContainer = styled.div`
  background: #ffffff;
  height: 100%;
`;

const FAQList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const FAQItem = styled.li`
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
`;

const FAQQuestion = styled.a`
  color: #576b95;
  text-decoration: none;
  font-size: 13px;
  cursor: pointer;
  display: block;
  padding: 10px 16px;
  transition: background-color 0.2s;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
    "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial,
    sans-serif;
  position: relative;
  line-height: 1.4;

  &:hover {
    background-color: #f5f5f5;
  }

  &:active {
    background-color: #ebebeb;
  }

  &::after {
    content: ">";
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #c8c8c8;
    font-size: 12px;
  }
`;

const FAQAnswer = styled.div`
  background: #f8f8f8;
  padding: 10px 16px;
  font-size: 12px;
  line-height: 1.5;
  color: #333333;
  border-top: 1px solid #e5e5e5;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
    "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial,
    sans-serif;
  animation: slideDown 0.2s ease-out;

  @keyframes slideDown {
    from {
      opacity: 0;
      max-height: 0;
      padding-top: 0;
      padding-bottom: 0;
    }
    to {
      opacity: 1;
      max-height: 200px;
      padding-top: 10px;
      padding-bottom: 10px;
    }
  }
`;

const FAQComponent = () => {
  const [faqData, setFaqData] = useState([]);
  const [expandedItems, setExpandedItems] = useState(new Set());

  useEffect(() => {
    loadFAQData();
  }, []);

  const loadFAQData = async () => {
    try {
      const response = await fetch("./faq.csv");
      const csvData = await response.text();
      const parsedData = parseCSV(csvData);
      if (parsedData.length > 0) {
        setFaqData(parsedData);
        console.log("FAQ data loaded successfully:", parsedData);
      }
    } catch (error) {
      console.error("Failed to load FAQ data:", error);
    }
  };

  const parseCSV = (csvText) => {
    const lines = csvText.trim().split("\n");
    const headers = lines[0].split(",");

    return lines.slice(1).map((line, index) => {
      const values = parseCSVLine(line);
      return {
        id: index,
        question: (values[0] && values[0].replace(/"/g, "")) || "",
        answer: (values[1] && values[1].replace(/"/g, "")) || "",
      };
    });
  };

  const parseCSVLine = (line) => {
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  };

  const toggleExpanded = (itemId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  // 总是显示FAQ容器，即使没有数据
  if (faqData.length === 0) {
    return (
      <FAQContainer>
        <div
          style={{
            padding: "16px",
            textAlign: "center",
            color: "#999",
            fontSize: "12px",
          }}
        >
          正在加载FAQ数据...
        </div>
      </FAQContainer>
    );
  }

  return (
    <FAQContainer>
      <FAQList>
        {faqData.map((item) => (
          <FAQItem key={item.id}>
            <FAQQuestion onClick={() => toggleExpanded(item.id)}>
              {item.question}
            </FAQQuestion>
            {expandedItems.has(item.id) && <FAQAnswer>{item.answer}</FAQAnswer>}
          </FAQItem>
        ))}
      </FAQList>
    </FAQContainer>
  );
};

export default FAQComponent;
