import axios from "axios";
import { SSM } from "aws-sdk";

const DC = "us8";

async function mailchimpAPIKey(): Promise<string> {
  const params = {
    Name: "MAILCHIMP_API_KEY" /* required */,
    WithDecryption: true
  };
  const ssm = new SSM();
  const response = await ssm.getParameter(params).promise();
  return response.Parameter.Value;
}

const LIST_ID = "79922a588c";

export default async (email: string, fname: string, lname: string) => {
  const API_URL = `https://${DC}.api.mailchimp.com/3.0/lists/${LIST_ID}/members`;
  try {
    const params = {
      email_address: email,
      status: "subscribed",
      merge_fields: {
        FNAME: fname,
        LNAME: lname
      }
    };

    const auth = {
      username: "any",
      password: await mailchimpAPIKey()
    };

    await axios.post(API_URL, params, { auth });

    const msg = `adding ${email}`;

    return { statusCode: 200, body: JSON.stringify({ success: msg }) };
  } catch (e) {
    let errorData = { unknownError: true };
    if (e.response && e.response.data) {
      if (e.response.data.title == "Member Exists") {
        return {
          statusCode: 200,
          body: JSON.stringify({
            success: "Member already exists, not updated"
          })
        };
      }

      errorData = e.response.data;
    }
    console.log(e);
    return {
      statusCode: 400,
      body: JSON.stringify(errorData)
    };
  }
};
